"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import SidebarNavCoach from "@/components/ui/SidebarNavCoach";
import MobileCoachBottomNav from "@/components/nav/MobileCoachBottomNav";

import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import {
  ArrowLeft,
  Send,
  MoreVertical,
  CornerUpLeft,
  Search,
  X,
  Paperclip,
  Flag,
  Ban,
  Check,
  CheckCheck,
  Loader2,
  Pin,
} from "lucide-react";

/* --------------------------- Types & constants --------------------------- */

type LocalUser = { id: string; name: string; role: string };

type MsgBase = {
  senderId: string;
  text: string; // "" for pure image messages
  createdAt?: Timestamp;
  imageUrl?: string;
  replyTo?: {
    id: string;
    text?: string;
    imageUrl?: string;
    senderName?: string;
  };
  reactions?: Record<string, string[]>; // emoji -> userIds
  deleted?: boolean;
};

type NewMessagePayload = Omit<MsgBase, "senderId" | "createdAt">;
type Message = MsgBase & { id: string; pending?: boolean; error?: boolean };

const PAGE_SIZE = 30;

/* -------------------------------- Helpers -------------------------------- */

const initials = (name?: string) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDateChip = (d: Date) => {
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Bugün";
  if (sameDay(d, yday)) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
};

function extractUrls(text: string | undefined) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/** If value looks like a Firebase Storage path, resolve to download URL; otherwise return as-is. */
async function resolveMaybeStorageURL(raw?: string): Promise<string | undefined> {
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    return await getDownloadURL(ref(storage, raw));
  } catch {
    return undefined;
  }
}

/* ----------------------- Minimal Lightbox (images) ----------------------- */
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center" onClick={onClose}>
      <img src={src} alt="Medya" className="max-w-[95vw] max-h-[90vh] object-contain" />
    </div>
  );
}

/* -------------------------- Tiny Emoji Picker --------------------------- */
const EMOJIS = ["😀", "❤️", "🔥", "👍", "👎", "🤔"];
function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <div className="border border-border bg-background rounded-xl p-1 shadow-md flex gap-1">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="h-8 w-8 rounded-md hover:bg-muted text-xl leading-none"
          aria-label={`React ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export default function ChatIdPage() {
  const { chatId } = useParams<{ chatId: string }>();

  // user / other
  const [user, setUser] = useState<LocalUser | null>(null);
  const [other, setOther] = useState<{
    id: string;
    name: string;
    avatarUrl?: string; // resolved URL for UI
    lastSeen?: Timestamp;
  } | null>(null);

  // messages & pagination
  const [messages, setMessages] = useState<Message[]>([]);
  const [firstCursor, setFirstCursor] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // unread / read receipts
  const [otherLastReadAt, setOtherLastReadAt] = useState<Timestamp | null>(null);

  // typing
  const [typingOther, setTypingOther] = useState(false);

  // composer
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; text?: string; imageUrl?: string; senderName?: string } | null>(
    null
  );
  const [files, setFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // ui niceties
  const listRef = useRef<HTMLDivElement | null>(null);

  // search
  const [searchOpen, setSearchOpen] = useState(false);
  const [queryText, setQueryText] = useState("");

  // pinned
  const [pinned, setPinned] = useState<string[]>([]); // message ids

  // block/report
  const [isBlocked, setIsBlocked] = useState(false);

  const myId = user?.id || "";
  const otherId = useMemo(() => {
    if (!chatId || !user?.id) return null;
    const parts = (chatId as string).split("_");
    return parts.find((p) => p !== user.id) || null;
  }, [chatId, user?.id]);

  const ready = !!(chatId && myId && otherId);

  /* ----------------------------- bootstrap user ----------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  /* ----------------------------- presence stub ----------------------------- */
  useEffect(() => {
    if (!myId) return;
    updateDoc(doc(db, "users", myId), { lastSeen: serverTimestamp() }).catch(() => {});
  }, [myId]);

  /* ----------------------------- load other user ---------------------------- */
  useEffect(() => {
    if (!otherId) return;
    (async () => {
      // Firestore "users/{otherId}" — avatar may be a STORAGE PATH; resolve it
      const fsSnap = await getDoc(doc(db, "users", otherId)).catch(() => null);
      const fsData = fsSnap?.exists() ? (fsSnap.data() as any) : null;

      const rawPic: string | undefined =
        fsData?.avatarPath || fsData?.profilePicture || fsData?.avatar || undefined;
      const avatarUrl = await resolveMaybeStorageURL(rawPic);

      // chat meta (pinned, blocked, lastReadAt)
      const convSnap = await getDoc(doc(db, "chats", chatId as string)).catch(() => null as any);
      const convData = convSnap?.exists() ? (convSnap.data() as any) : null;
      setPinned(convData?.pinnedMessageIds || []);
      const blockedList: string[] = convData?.blockedBy || [];
      setIsBlocked(blockedList?.includes?.(myId) || false);
      if (convData?.lastReadAt && convData.lastReadAt[otherId]) {
        setOtherLastReadAt(convData.lastReadAt[otherId]);
      }

      setOther({
        id: otherId,
        name: fsData?.name || "Bilinmeyen",
        avatarUrl,
        lastSeen: fsData?.lastSeen,
      });
    })();
  }, [otherId, chatId, myId]);

  /* ------------------------ subscribe typing + receipts ---------------------- */
  useEffect(() => {
    if (!chatId || !otherId) return;

    const typingRef = doc(db, `chats/${chatId}/typingStates/${otherId}`);
    const unsubTyping = onSnapshot(typingRef, (snap) => setTypingOther(!!snap.data()?.isTyping));

    const convRef = doc(db, "chats", chatId as string);
    const unsubConv = onSnapshot(convRef, (snap) => {
      const d = snap.data() as any;
      if (d?.lastReadAt?.[otherId]) setOtherLastReadAt(d.lastReadAt[otherId]);
      setPinned(d?.pinnedMessageIds || []);
      const blockedList: string[] = d?.blockedBy || [];
      setIsBlocked(blockedList?.includes?.(myId) || false);
    });

    return () => {
      unsubTyping();
      unsubConv();
    };
  }, [chatId, otherId, myId]);

  /* ---------------------- load latest page (no auto-scroll) ------------------ */
  const [liveUnsub, setLiveUnsub] = useState<null | (() => void)>(null);

  const loadLatest = useCallback(async () => {
    if (!chatId) return;
    const col = collection(db, `chats/${chatId}/messages`);
    const q0 = query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const snap = await getDocs(q0);
    const docs = snap.docs;
    setHasMore(docs.length === PAGE_SIZE);
    setFirstCursor(docs[docs.length - 1] || null);
    const arr = docs.map((d) => ({ id: d.id, ...(d.data() as MsgBase) })) as Message[];
    arr.reverse(); // ASC for UI
    setMessages(arr);

    // live subscription (merge only, no auto-scroll)
    liveUnsub?.();
    const qLive = query(col, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(qLive, (live) => {
      const latest = live.docs.map((d) => ({ id: d.id, ...(d.data() as MsgBase) })) as Message[];
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        for (const m of latest) {
          if (!seen.has(m.id)) merged.push(m);
        }
        return merged;
      });
    });
    setLiveUnsub(() => unsub);
  }, [chatId, liveUnsub]);

  useEffect(() => {
    loadLatest();
    return () => liveUnsub?.();
  }, [loadLatest]); // eslint-disable-line

  /* -------------------------- load older on scroll top ----------------------- */
  const loadOlder = useCallback(async () => {
    if (!chatId || !hasMore || !firstCursor) return;
    const col = collection(db, `chats/${chatId}/messages`);
    const qOlder = query(col, orderBy("createdAt", "desc"), startAfter(firstCursor), limit(PAGE_SIZE));
    const snap = await getDocs(qOlder);
    const docs = snap.docs;
    setHasMore(docs.length === PAGE_SIZE);
    setFirstCursor(docs[docs.length - 1] || null);
    const arr = docs.map((d) => ({ id: d.id, ...(d.data() as MsgBase) })) as Message[];
    arr.reverse(); // ASC
    setMessages((prev) => [...arr, ...prev]);
  }, [chatId, hasMore, firstCursor]);

  /* ------------------------------ scroll logic ------------------------------ */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop <= 0) loadOlder();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadOlder]);

  /* ----------------------- read my unread & lastReadAt ----------------------- */
  useEffect(() => {
    if (!chatId || !myId) return;
    updateDoc(doc(db, "chats", chatId as string), {
      [`unread_${myId}`]: 0,
      [`lastReadAt.${myId}`]: serverTimestamp(),
    }).catch(() => {});
  }, [chatId, myId, messages.length]);

  /* --------------------------- persist draft per chat ------------------------ */
  useEffect(() => {
    if (!chatId) return;
    const saved = localStorage.getItem(`draft:${chatId}`);
    if (saved) setText(saved);
  }, [chatId]);
  useEffect(() => {
    if (!chatId) return;
    localStorage.setItem(`draft:${chatId}`, text);
  }, [chatId, text]);

  /* ------------------------------- handlers --------------------------------- */

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 8);
    setFiles((prev) => [...prev, ...arr]);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const picked: File[] = [];
    for (const it of items as any) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) picked.push(f);
      }
    }
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
  };

  /** Ensure no undefined fields are written to Firestore */
  const buildCleanPayload = (payload: NewMessagePayload) => {
    const out: any = { text: payload.text };
    if (payload.imageUrl) out.imageUrl = payload.imageUrl;
    if (payload.replyTo) out.replyTo = payload.replyTo; // only include if defined
    if (payload.reactions) out.reactions = payload.reactions;
    if (payload.deleted !== undefined) out.deleted = payload.deleted;
    return out as NewMessagePayload;
  };

  const sendOne = async (payload: NewMessagePayload) => {
    if (!ready) return;

    const clean = buildCleanPayload(payload);

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: Message = { id: tempId, senderId: myId, ...clean, pending: true };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const docRef = await addDoc(collection(db, `chats/${chatId}/messages`), {
        ...clean,
        senderId: myId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", chatId as string), {
        lastMessage: clean.text || (clean.imageUrl ? "[Resim]" : ""),
        updatedAt: serverTimestamp(),
        [`unread_${otherId}`]: increment(1),
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: docRef.id, pending: false } : m))
      );
    } catch (e) {
      console.error("Mesaj gönderilemedi:", e);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, error: true } : m))
      );
    }
  };

  const handleSend = async () => {
    if (sending || !ready) return;
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    setSending(true);
    try {
      // images first (each as its own message)
      for (const f of files) {
        const imageRef = ref(storage, `chatImages/${chatId}/${Date.now()}_${f.name}`);
        const snap = await uploadBytes(imageRef, f);
        const url = await getDownloadURL(snap.ref);
        await sendOne({ text: "", imageUrl: url, ...(replyTo ? { replyTo } : {}) });
      }
      if (trimmed) {
        await sendOne({ text: trimmed, ...(replyTo ? { replyTo } : {}) });
      }
      setFiles([]);
      setReplyTo(null);
      setText("");
    } finally {
      setSending(false);
    }

    // stop typing
    await setDoc(doc(db, `chats/${chatId}/typingStates/${myId}`), { isTyping: false }).catch(() => {});
  };

  const handleTyping = async (val: string) => {
    setText(val);
    if (chatId && myId) {
      await setDoc(doc(db, `chats/${chatId}/typingStates/${myId}`), { isTyping: true }).catch(() => {});
    }
  };

  const retrySend = async (m: Message) => {
    if (!m.error) return;
    const payload: NewMessagePayload = {
      text: m.text,
      ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
      ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    };
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    await sendOne(payload);
  };

  const toggleReaction = async (m: Message, emoji: string) => {
    const has = m.reactions?.[emoji]?.includes(myId);
    const newMap = { ...(m.reactions || {}) };
    if (!newMap[emoji]) newMap[emoji] = [];
    if (has) newMap[emoji] = newMap[emoji].filter((id) => id !== myId);
    else newMap[emoji] = [...newMap[emoji], myId];
    await updateDoc(doc(db, `chats/${chatId}/messages`, m.id), { reactions: newMap }).catch(() => {});
  };

  const copyText = async (t?: string) => {
    if (!t) return;
    await navigator.clipboard.writeText(t).catch(() => {});
  };

  const deleteMine = async (m: Message) => {
    if (m.senderId !== myId) return;
    await deleteDoc(doc(db, `chats/${chatId}/messages`, m.id)).catch(() => {});
  };

  const pinToggle = async (m: Message) => {
    const currentlyPinned = pinned.includes(m.id);
    const newPins = currentlyPinned ? pinned.filter((id) => id !== m.id) : [...pinned, m.id];
    await updateDoc(doc(db, "chats", chatId as string), { pinnedMessageIds: newPins }).catch(() => {});
  };

  const blockToggle = async () => {
    const convRef = doc(db, "chats", chatId as string);
    const snap = await getDoc(convRef);
    const data = snap.exists() ? (snap.data() as any) : {};
    const arr: string[] = data.blockedBy || [];
    const now = arr.includes(myId) ? arr.filter((x) => x !== myId) : [...arr, myId];
    await updateDoc(convRef, { blockedBy: now }).catch(() => {});
  };

  /* --------------------------------- UI bits -------------------------------- */

  const grouped = useMemo(() => {
    const base = queryText
      ? messages.filter((m) => (m.text || "").toLowerCase().includes(queryText.toLowerCase()))
      : messages;

    const out: Array<{ type: "date" | "msg"; id: string; date?: string; msg?: Message }> = [];
    let lastDate = "";
    for (const m of base) {
      const d = m.createdAt?.toDate?.() || new Date();
      const chip = formatDateChip(d);
      if (chip !== lastDate) {
        out.push({ type: "date", id: `d-${d.getTime()}`, date: chip });
        lastDate = chip;
      }
      out.push({ type: "msg", id: m.id, msg: m });
    }
    return out;
  }, [messages, queryText]);

  const isReadByOther = (m: Message) =>
    !!(otherLastReadAt && m.createdAt && otherLastReadAt.toMillis() >= m.createdAt.toMillis());

  const renderTicks = (m: Message) => {
    if (m.pending) return <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" />;
    if (m.error) return <span className="text-xs text-red-500">Hata</span>;
    return isReadByOther(m) ? (
      <span className="inline-flex items-center gap-0.5 opacity-80"><CheckCheck className="h-3.5 w-3.5" /></span>
    ) : (
      <span className="inline-flex items-center gap-0.5 opacity-60"><Check className="h-3.5 w-3.5" /></span>
    );
  };

  /* ---------------------------------- render --------------------------------- */

  return (
    <div className="relative flex">
      {/* Sidebar md+ only */}
      <div className="hidden md:block">
        <SidebarNavCoach unreadCount={0} />
      </div>

      {/* Content */}
      <main className="w-full min-h-screen md:ml-16 pb-16 md:pb-0">
        {/* min-h-0 so inner scroll can scroll */}
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-4 md:py-6 flex flex-col h-[calc(100svh-3.5rem)] md:h-[calc(100vh-2rem)] min-h-0">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border -mx-4 md:-mx-6 px-4 md:px-6 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/${user?.role || "user"}/messages`}
                className="text-primary hover:opacity-80 flex items-center gap-1"
              >
                <ArrowLeft size={18} />
                <span className="text-sm">Geri</span>
              </Link>

              <div className="ml-auto flex items-center gap-3">
                <div className="relative w-8 h-8 shrink-0">
                  {other?.avatarUrl ? (
                    <Image
                      src={other.avatarUrl}
                      alt={other.name}
                      fill
                      sizes="32px"
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 text-zinc-800 dark:text-zinc-100 text-[11px] font-semibold flex items-center justify-center">
                      {initials(other?.name)}
                    </div>
                  )}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground">{other?.name || "Bilinmeyen"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {typingOther
                      ? "Yazıyor…"
                      : other?.lastSeen
                      ? `Son görülme ${other.lastSeen.toDate().toLocaleString("tr-TR")}`
                      : "Çevrimdışı"}
                  </div>
                </div>

                {/* Search toggle */}
                <button className="p-2 rounded hover:bg-muted" onClick={() => setSearchOpen((s) => !s)} aria-label="Ara">
                  <Search className="h-5 w-5" />
                </button>

                {/* Block / Report */}
                <div className="relative">
                  <details className="group">
                    <summary className="list-none p-2 rounded hover:bg-muted cursor-pointer">
                      <MoreVertical className="h-5 w-5" />
                    </summary>
                    <div className="absolute right-0 mt-1 w-48 border border-border rounded-md bg-background shadow-md p-1 z-30">
                      <button onClick={blockToggle} className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2">
                        <Ban className="h-4 w-4" /> {isBlocked ? "Engeli Kaldır" : "Engelle"}
                      </button>
                      <button className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2">
                        <Flag className="h-4 w-4" /> Rapor Et
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {searchOpen && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Bu sohbette ara…"
                  className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm outline-none"
                />
                <button className="p-2 rounded hover:bg-muted" onClick={() => setSearchOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Pinned ribbon */}
            {pinned.length > 0 && (
              <div className="-mb-2 mt-2 flex gap-2 overflow-x-auto">
                {pinned.map((id) => {
                  const msg = messages.find((m) => m.id === id);
                  if (!msg) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        const el = document.querySelector(`[data-msg="${id}"]`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 whitespace-nowrap"
                      title={msg.text || (msg.imageUrl ? "Resim" : "")}
                    >
                      <Pin size={10} className="inline mr-0.5" />{msg.text?.slice(0, 24) || "Resim"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Messages list */}
          <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 py-3 space-y-2">
            {grouped.map((row) =>
              row.type === "date" ? (
                <div key={row.id} className="sticky top-2 z-10 flex justify-center">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {row.date}
                  </span>
                </div>
              ) : (
                <MessageBubble
                  key={row.id}
                  msg={row.msg!}
                  mine={row.msg!.senderId === myId}
                  otherName={other?.name || "Bilinmeyen"}
                  onReply={setReplyTo}
                  onCopy={copyText}
                  onDelete={deleteMine}
                  onPin={pinToggle}
                  onReact={(emoji) => toggleReaction(row.msg!, emoji)}
                  onRetry={() => retrySend(row.msg!)}
                  onOpenImage={setLightbox}
                  readTicks={renderTicks(row.msg!)}
                />
              )
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border pt-2 mt-1">
            {replyTo && (
              <div className="mb-2 flex items-start gap-2 bg-muted/60 rounded-lg p-2">
                <CornerUpLeft className="h-4 w-4 mt-0.5" />
                <div className="text-xs">
                  <div className="font-medium">{replyTo.senderName || "Yanıtlanan mesaj"}</div>
                  {replyTo.text && <div className="line-clamp-1">{replyTo.text}</div>}
                  {replyTo.imageUrl && <div className="text-muted-foreground">[Resim]</div>}
                </div>
                <button className="ml-auto p-1 hover:bg-muted rounded" onClick={() => setReplyTo(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {files.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto">
                {files.map((f, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(f)} alt="Önizleme" className="object-cover w-full h-full" />
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="flex items-center gap-2"
              onDrop={(e) => {
                e.preventDefault();
                handlePickFiles(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePickFiles(e.target.files)}
                />
                <Paperclip className="text-primary hover:opacity-80" size={20} />
              </label>

              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onPaste={handlePaste}
                className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground border-border"
                placeholder={!ready ? "Sohbet yükleniyor..." : isBlocked ? "Bu sohbet engellendi" : "Mesaj yaz..."}
                disabled={isBlocked || !ready}
              />

              <button
                onClick={handleSend}
                disabled={!ready || (text.trim() === "" && files.length === 0) || isBlocked || sending}
                className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-full p-2"
                aria-label="Gönder"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav on mobile */}
      <MobileCoachBottomNav unreadNotifications={0} />

      {/* lightbox */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ------------------------------ Message bubble ----------------------------- */

function MessageBubble({
  msg,
  mine,
  otherName,
  onReply,
  onCopy,
  onDelete,
  onPin,
  onReact,
  onRetry,
  onOpenImage,
  readTicks,
}: {
  msg: Message;
  mine: boolean;
  otherName: string;
  onReply: (info: { id: string; text?: string; imageUrl?: string; senderName?: string }) => void;
  onCopy: (t?: string) => void;
  onDelete: (m: Message) => void;
  onPin: (m: Message) => void;
  onReact: (emoji: string) => void;
  onRetry: () => void;
  onOpenImage: (url: string) => void;
  readTicks: React.ReactNode;
}) {
  const urls = extractUrls(msg.text);

  return (
    <div
      data-msg={msg.id}
      className={`group max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line break-words flex flex-col ${
        mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
      }`}
    >
      {msg.replyTo && (
        <div className={`text-xs rounded-md px-2 py-1 mb-1 ${mine ? "bg-black/10" : "bg-white/50"}`}>
          <span className="font-medium">{msg.replyTo.senderName || "Yanıtlanan"}</span>
          {msg.replyTo.text && <div className="line-clamp-1">{msg.replyTo.text}</div>}
          {msg.replyTo.imageUrl && <div className="opacity-75">[Resim]</div>}
        </div>
      )}

      {msg.imageUrl && (
        <img
          src={msg.imageUrl}
          alt="Gönderilen"
          className="rounded mb-2 max-w-full h-auto cursor-zoom-in"
          onClick={() => onOpenImage(msg.imageUrl!)}
        />
      )}

      {!!msg.text && <span>{msg.text}</span>}

      {urls.length > 0 && (
        <div className={`mt-2 text-xs ${mine ? "opacity-90" : "opacity-80"}`}>
          {urls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="underline break-all">
              {u}
            </a>
          ))}
        </div>
      )}

      <div className={`mt-1 text-[10px] flex items-center gap-2 ${mine ? "opacity-80" : "text-muted-foreground"}`}>
        {msg.createdAt?.seconds &&
          new Date(msg.createdAt.seconds * 1000).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        <span className="ml-auto inline-flex items-center">{readTicks}</span>
      </div>

      {msg.error && (
        <button onClick={onRetry} className="text-[11px] mt-1 underline">
          Yeniden dene
        </button>
      )}

      <div className={`opacity-0 group-hover:opacity-100 transition mt-1 -mb-1 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
        <details className="relative">
          <summary className="list-none text-[11px] px-1.5 py-0.5 rounded hover:bg-black/10 cursor-pointer inline-flex items-center gap-1">
            Tepki
          </summary>
          <div className="absolute z-30 mt-1">
            <EmojiPicker onPick={(e) => onReact(e)} />
          </div>
        </details>

        <button
          onClick={() =>
            onReply({ id: msg.id, text: msg.text, imageUrl: msg.imageUrl, senderName: mine ? "Siz" : otherName })
          }
          className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/10"
        >
          Yanıtla
        </button>
        {!!msg.text && (
          <button onClick={() => onCopy(msg.text)} className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/10">
            Kopyala
          </button>
        )}
        {mine && (
          <button onClick={() => onDelete(msg)} className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/10">
            Sil
          </button>
        )}
        <button onClick={() => onPin(msg)} className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/10">
          <Pin size={11} className="inline mr-1" />Sabitle
        </button>
      </div>

      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className={`mt-1 flex gap-1 ${mine ? "justify-end" : "justify-start"}`}>
          {Object.entries(msg.reactions).map(([emoji, ids]) => (
            <span key={emoji} className="text-xs px-1.5 py-0.5 rounded-full bg-black/10">
              {emoji} {ids.length}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
