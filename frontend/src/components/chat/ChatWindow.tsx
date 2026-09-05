"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { db, storage } from "@/lib/firebase";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  increment, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, startAfter, Timestamp, updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ArrowLeft, Send, MoreVertical, CornerUpLeft, Search, X,
  Paperclip, Flag, Ban, Check, CheckCheck, Loader2,
  Mic, MicOff, Play, Pause, FileText, Smile, Zap,
} from "lucide-react";

const PAGE_SIZE = 30;

/* ───────────────────────────── Types ───────────────────────────────── */

type MsgType = "text" | "image" | "voice" | "file" | "checkin_request" | "checkin_response";

export type CheckInData = {
  mood: number;
  weight?: number;
  completed: boolean;
  note?: string;
};

type MsgBase = {
  senderId: string;
  senderName?: string;
  type?: MsgType;
  text: string;
  createdAt?: Timestamp;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  fileUrl?: string;
  fileName?: string;
  checkInData?: CheckInData;
  checkInRequestMsgId?: string;
  replyTo?: { id: string; text?: string; imageUrl?: string; senderName?: string };
  reactions?: Record<string, string[]>;
  deleted?: boolean;
};

type Message = MsgBase & { id: string; pending?: boolean; error?: boolean };
type LocalUser = { id: string; name: string; role: string };

/* ─────────────────────────── Helpers ───────────────────────────────── */

const initials = (name?: string) =>
  (name || "").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

const fmtDate = (d: Date) => {
  const today = new Date();
  const yday = new Date(); yday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Bugün";
  if (same(d, yday)) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

async function resolveStorageURL(raw?: string): Promise<string | undefined> {
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  try { return await getDownloadURL(ref(storage, raw)); } catch { return undefined; }
}

/* ─────────────────────────── Lightbox ──────────────────────────────── */

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
      <img src={src} alt="" className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl" />
    </div>
  );
}

/* ─────────────────────────── Voice Player ───────────────────────────── */

function VoicePlayer({ url, duration = 0, mine }: { url: string; duration?: number; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bars = useMemo(() => {
    let seed = url.length;
    return Array.from({ length: 30 }, (_, i) => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return 4 + (Math.abs(seed) % 14);
    });
  }, [url]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => {}); setPlaying(true); }
  };

  const progress = duration > 0 ? current / duration : 0;

  return (
    <div className="flex items-center gap-2 min-w-[200px] max-w-[260px]">
      <audio ref={audioRef} src={url}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)} />
      <button onClick={toggle}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition ${mine ? "bg-white/20 hover:bg-white/30 text-white" : "bg-primary/10 hover:bg-primary/20 text-primary"}`}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex items-end gap-[2px] flex-1 h-8">
        {bars.map((h, i) => {
          const filled = i / bars.length <= progress;
          const active = playing && Math.abs(i / bars.length - progress) < 0.08;
          return (
            <div key={i} style={{ height: active ? h + 3 : h }}
              className={`w-[3px] rounded-full transition-all ${filled ? (mine ? "bg-white" : "bg-primary") : (mine ? "bg-white/25" : "bg-primary/25")}`} />
          );
        })}
      </div>
      <span className={`text-[11px] shrink-0 tabular-nums ${mine ? "text-white/70" : "text-muted-foreground"}`}>
        {fmtTime(current > 0 ? current : duration)}
      </span>
    </div>
  );
}

/* ─────────────────────── Check-in Cards ────────────────────────────── */

function CheckInRequestCard({ mine, responded, onRespond }: { mine: boolean; responded: boolean; onRespond: () => void }) {
  return (
    <div className={`rounded-2xl p-4 space-y-3 w-64 ${mine ? "bg-white/10 border border-white/20" : "bg-amber-50 dark:bg-amber-900/20 border border-amber-300/40"}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">📋</span>
        <div>
          <p className="font-semibold text-sm">Günlük Check-in</p>
          <p className={`text-xs ${mine ? "text-white/60" : "text-muted-foreground"}`}>Koçun bilgi istiyor</p>
        </div>
      </div>
      {!mine && !responded && (
        <button onClick={onRespond}
          className="w-full bg-primary text-primary-foreground text-sm py-2 rounded-xl font-medium hover:opacity-90 transition">
          Yanıtla →
        </button>
      )}
      {!mine && responded && <p className="text-xs text-green-600 dark:text-green-400 text-center">Yanıtlandı ✓</p>}
      {mine && <p className={`text-xs text-center ${mine ? "text-white/50" : "text-muted-foreground"}`}>Yanıt bekleniyor…</p>}
    </div>
  );
}

function CheckInResponseCard({ data, mine }: { data: CheckInData; mine: boolean }) {
  const moodLabel = ["", "Kötü 😞", "Zayıf 😕", "Orta 😐", "İyi 😊", "Harika 🤩"][data.mood] || "—";
  return (
    <div className={`rounded-2xl p-4 space-y-2 w-64 ${mine ? "bg-white/10 border border-white/20" : "bg-green-50 dark:bg-green-900/20 border border-green-300/40"}`}>
      <p className="font-semibold text-sm flex items-center gap-1.5">✅ Check-in Yanıtı</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div><span className={`text-xs ${mine ? "text-white/50" : "text-muted-foreground"}`}>Ruh hali</span><p className="font-medium">{moodLabel}</p></div>
        {data.weight && <div><span className={`text-xs ${mine ? "text-white/50" : "text-muted-foreground"}`}>Ağırlık</span><p className="font-medium">{data.weight} kg</p></div>}
        <div className="col-span-2"><span className={`text-xs ${mine ? "text-white/50" : "text-muted-foreground"}`}>Antrenman</span>
          <p className="font-medium">{data.completed ? "✅ Tamamlandı" : "❌ Yapılmadı"}</p></div>
      </div>
      {data.note && <p className={`text-xs border-t pt-2 ${mine ? "border-white/20 text-white/70" : "border-border text-muted-foreground"}`}>{data.note}</p>}
    </div>
  );
}

function CheckInFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: CheckInData) => void }) {
  const [mood, setMood] = useState(3);
  const [weight, setWeight] = useState("");
  const [completed, setCompleted] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Günlük Check-in</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <p className="text-sm font-medium mb-3">Bugün nasıl hissediyorsun?</p>
          <div className="flex gap-2">
            {([{v:1,e:"😞"},{v:2,e:"😕"},{v:3,e:"😐"},{v:4,e:"😊"},{v:5,e:"🤩"}] as {v:number;e:string}[]).map(({v,e}) => (
              <button key={v} onClick={() => setMood(v)}
                className={`flex-1 py-3 rounded-xl text-2xl border-2 transition ${mood === v ? "border-primary bg-primary/10 scale-110" : "border-border"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Ağırlık <span className="text-muted-foreground font-normal">(opsiyonel)</span></p>
          <div className="relative">
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="68.5" step="0.1"
              className="w-full border rounded-xl px-3 py-2 pr-10 text-sm bg-background outline-none focus:ring-2 focus:ring-ring border-border" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">kg</span>
          </div>
        </div>
        <button onClick={() => setCompleted(!completed)}
          className={`w-full py-3 rounded-xl border-2 text-sm font-medium transition ${completed ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "border-border text-muted-foreground"}`}>
          {completed ? "✅ Antrenmanı tamamladım" : "🏋️ Antrenmanı tamamladım mı?"}
        </button>
        <div>
          <p className="text-sm font-medium mb-1">Not <span className="text-muted-foreground font-normal">(opsiyonel)</span></p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Bugün hakkında bir şey yaz…"
            className="w-full border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring resize-none border-border" />
        </div>
        <button onClick={() => onSubmit({ mood, weight: weight ? Number(weight) : undefined, completed, note: note.trim() || undefined })}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition">
          Gönder
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── Emoji Picker ──────────────────────────────── */

const EMOJI_TABS: Record<string, string[]> = {
  "😊": ["😀","😂","😍","🥰","😎","🤩","😅","🙏","❤️","💪","🔥","✅","⚡","🎉","👏","🫂","👍","👎","🤔","😴"],
  "🏋️": ["🏋️","🤸","🚴","🧘","🏊","⛹️","🤾","🥊","🥋","🏃","🧗","🤺","🏂","🎿","🛹","🤽"],
  "🥗": ["🥗","🥑","🍗","🥦","🍳","💧","🧃","🫐","🍎","🍌","🥕","🥩","🍜","🥚","🧆","🫙"],
};

function EmojiPickerPanel({ onPick, forInput }: { onPick: (e: string) => void; forInput?: boolean }) {
  const [tab, setTab] = useState<string>("😊");
  return (
    <div className={`border border-border bg-background rounded-xl shadow-xl p-2 ${forInput ? "w-72" : "w-56"}`}>
      <div className="flex gap-1 mb-2">
        {Object.keys(EMOJI_TABS).map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-base px-2 py-1 rounded-lg flex-1 transition ${tab === k ? "bg-muted font-bold" : "hover:bg-muted/50"}`}>{k}</button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {EMOJI_TABS[tab].map(e => (
          <button key={e} onClick={() => onPick(e)}
            className="h-9 w-9 rounded-lg hover:bg-muted text-xl leading-none flex items-center justify-center">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Templates Panel ───────────────────────────── */

const TEMPLATES = [
  { cat: "💪 Motivasyon", items: [
    "Harika antrenman! Böyle devam et! 💪🔥",
    "Bu hafta çok iyi iş çıkardın, kendinle gurur duy! 🌟",
    "Her gün biraz daha iyi oluyorsun! 📈",
    "Zorlu geçiyor ama sen bunu başarabilirsin! 🔥",
  ]},
  { cat: "📋 Hatırlatma", items: [
    "💧 Bugün en az 2 litre su içmeyi unutma!",
    "😴 Uyku çok önemli, erken yat!",
    "🥗 Beslenme planına bugün sadık kaldın mı?",
    "Yarın antrenman var, hazır ol! 🏋️",
  ]},
  { cat: "📊 Takip", items: [
    "Bu hafta nasıl geçti? Check-in yapalım!",
    "Ağırlığını ölçtün mü?",
    "Geçen haftaya göre nasıl hissediyorsun?",
    "Hedeflerimize ne kadar yaklaştık? 🎯",
  ]},
];

function TemplatesPanel({ onSelect }: { onSelect: (t: string) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border border-border bg-background rounded-xl shadow-xl p-2 w-72 max-h-72 overflow-y-auto">
      <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Hızlı mesajlar</p>
      {TEMPLATES.map((cat, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted text-sm font-medium flex items-center justify-between">
            {cat.cat} <span className="text-muted-foreground text-xs">{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div className="pl-2 pb-1 space-y-0.5">
              {cat.items.map((t, j) => (
                <button key={j} onClick={() => onSelect(t)}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted text-xs text-muted-foreground leading-snug">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────── File Card ─────────────────────────────────── */

function FileCard({ url, name, mine }: { url: string; name: string; mine: boolean }) {
  const ext = name.split(".").pop()?.toUpperCase().slice(0, 4) || "FILE";
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-3 rounded-xl p-3 border max-w-[220px] hover:opacity-80 transition ${mine ? "border-white/20 bg-white/10" : "border-border bg-muted/40"}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold ${mine ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
        {ext}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className={`text-[10px] ${mine ? "text-white/50" : "text-muted-foreground"}`}>Dosyayı indir</p>
      </div>
    </a>
  );
}

/* ─────────────────────── Message Bubble ────────────────────────────── */

type BubbleProps = {
  msg: Message;
  mine: boolean;
  myId: string;
  myRole: "coach" | "user";
  otherName: string;
  pinned: string[];
  checkInResponded: boolean;
  onReply: (m: Message) => void;
  onCopy: (t: string) => void;
  onDelete: (m: Message) => void;
  onPin: (m: Message) => void;
  onReact: (m: Message, emoji: string) => void;
  onRetry: (m: Message) => void;
  onOpenImage: (url: string) => void;
  onCheckInRespond: (m: Message) => void;
  readTicks: React.ReactNode;
};

function MessageBubble({
  msg, mine, myId, myRole, otherName, pinned, checkInResponded,
  onReply, onCopy, onDelete, onPin, onReact, onRetry,
  onOpenImage, onCheckInRespond, readTicks,
}: BubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const type = msg.type || (msg.imageUrl ? "image" : "text");
  const isPinned = pinned.includes(msg.id);

  if (msg.deleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} px-2`} data-msg={msg.id}>
        <p className="text-xs text-muted-foreground italic px-3 py-2 rounded-xl bg-muted">Mesaj silindi</p>
      </div>
    );
  }

  const bubbleBase = `relative max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm shadow-sm`;
  const mineStyle = `${bubbleBase} bg-indigo-600 text-white rounded-br-sm`;
  const otherStyle = `${bubbleBase} bg-card dark:bg-zinc-800 border border-border text-foreground rounded-bl-sm`;
  const bubbleCls = mine ? mineStyle : otherStyle;

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"} px-2 group`} data-msg={msg.id}>
      {!mine && <p className="text-[11px] text-muted-foreground ml-1 mb-0.5">{otherName}</p>}
      {isPinned && <p className={`text-[10px] mb-0.5 ${mine ? "text-white/50" : "text-muted-foreground"}`}>📌 Sabitlendi</p>}

      {/* Reply preview */}
      {msg.replyTo && (
        <div className={`max-w-[80%] md:max-w-[65%] mb-1 px-3 py-1.5 rounded-xl border-l-4 text-xs ${mine ? "bg-indigo-800/60 border-indigo-300/60 text-indigo-100" : "bg-muted border-border text-muted-foreground"}`}>
          <p className="font-medium">{msg.replyTo.senderName}</p>
          <p className="truncate">{msg.replyTo.text || (msg.replyTo.imageUrl ? "[Resim]" : "")}</p>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        {!mine && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => setReactionPickerOpen(!reactionPickerOpen)} className="p-1 rounded-lg bg-background border border-border hover:bg-muted shadow-sm"><Smile className="w-3.5 h-3.5 text-muted-foreground" /></button>
            <button onClick={() => onReply(msg)} className="p-1 rounded-lg bg-background border border-border hover:bg-muted shadow-sm"><CornerUpLeft className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
        )}

        {/* Main bubble */}
        <div className={bubbleCls}>
          {/* Type-specific content */}
          {type === "image" && msg.imageUrl && (
            <button onClick={() => onOpenImage(msg.imageUrl!)} className="block -mx-1">
              <img src={msg.imageUrl} alt="" className="rounded-xl max-w-full max-h-64 object-cover hover:opacity-90 transition" />
            </button>
          )}
          {type === "voice" && msg.audioUrl && (
            <VoicePlayer url={msg.audioUrl} duration={msg.audioDuration} mine={mine} />
          )}
          {type === "file" && msg.fileUrl && msg.fileName && (
            <FileCard url={msg.fileUrl} name={msg.fileName} mine={mine} />
          )}
          {type === "checkin_request" && (
            <CheckInRequestCard mine={mine} responded={checkInResponded} onRespond={() => onCheckInRespond(msg)} />
          )}
          {type === "checkin_response" && msg.checkInData && (
            <CheckInResponseCard data={msg.checkInData} mine={mine} />
          )}
          {(type === "text" || (!msg.imageUrl && !msg.audioUrl && !msg.fileUrl && type !== "checkin_request" && type !== "checkin_response")) && msg.text && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
          )}
          {/* Text caption under image */}
          {type === "image" && msg.text && (
            <p className="mt-1.5 text-sm whitespace-pre-wrap break-words">{msg.text}</p>
          )}

          {/* Time + status */}
          <div className={`flex items-center gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${mine ? "text-white/50" : "text-muted-foreground"}`}>
              {msg.createdAt?.toDate().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) || ""}
            </span>
            {mine && <span className={mine ? "text-white/70" : ""}>{readTicks}</span>}
            {msg.error && <button onClick={() => onRetry(msg)} className="text-[10px] text-red-300 underline">yeniden dene</button>}
          </div>
        </div>

        {mine && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => setReactionPickerOpen(!reactionPickerOpen)} className="p-1 rounded-lg bg-background border border-border hover:bg-muted shadow-sm"><Smile className="w-3.5 h-3.5 text-muted-foreground" /></button>
            <button onClick={() => onReply(msg)} className="p-1 rounded-lg bg-background border border-border hover:bg-muted shadow-sm"><CornerUpLeft className="w-3.5 h-3.5 text-muted-foreground" /></button>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg bg-background border border-border hover:bg-muted shadow-sm"><MoreVertical className="w-3.5 h-3.5 text-muted-foreground" /></button>
              {menuOpen && (
                <div className="absolute right-8 top-0 w-36 border border-border rounded-xl bg-background shadow-xl p-1 z-30">
                  {msg.text && <button onClick={() => { onCopy(msg.text); setMenuOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs">Kopyala</button>}
                  <button onClick={() => { onPin(msg); setMenuOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs">{isPinned ? "Sabitlemeyi kaldır" : "Sabitle"}</button>
                  <button onClick={() => { onDelete(msg); setMenuOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs text-red-500">Sil</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reaction picker popup */}
      {reactionPickerOpen && (
        <div className={`mt-1 ${mine ? "mr-2" : "ml-2"}`} onClick={() => setReactionPickerOpen(false)}>
          <EmojiPickerPanel onPick={(e) => { onReact(msg, e); setReactionPickerOpen(false); }} />
        </div>
      )}

      {/* Reactions row */}
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(msg.reactions).map(([emoji, ids]) =>
            ids.length > 0 ? (
              <button key={emoji} onClick={() => onReact(msg, emoji)}
                className={`text-xs px-2 py-0.5 rounded-full border transition ${ids.includes(myId) ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300" : "bg-muted border-border"}`}>
                {emoji} {ids.length}
              </button>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Main ChatWindow ───────────────────────────── */

interface ChatWindowProps {
  chatId: string;
  myRole: "coach" | "user";
  backHref: string;
}

export default function ChatWindow({ chatId, myRole, backHref }: ChatWindowProps) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [other, setOther] = useState<{ id: string; name: string; avatarUrl?: string; lastSeen?: Timestamp } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [firstCursor, setFirstCursor] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [otherLastReadAt, setOtherLastReadAt] = useState<Timestamp | null>(null);
  const [typingOther, setTypingOther] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message["replyTo"] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);
  const [activeCheckInMsg, setActiveCheckInMsg] = useState<Message | null>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const liveUnsubRef = useRef<(() => void) | null>(null);

  const myId = user?.id || "";
  const otherId = useMemo(() => {
    if (!chatId || !user?.id) return null;
    return chatId.split("_").find((p) => p !== user.id) || null;
  }, [chatId, user?.id]);
  const ready = !!(chatId && myId && otherId);

  // Check-in response map: requestMsgId -> response message
  const checkInResponseMap = useMemo(() => {
    const map = new Map<string, Message>();
    for (const m of messages) {
      if (m.type === "checkin_response" && m.checkInRequestMsgId) {
        map.set(m.checkInRequestMsgId, m);
      }
    }
    return map;
  }, [messages]);

  /* ── Bootstrap user ── */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  /* ── Presence ── */
  useEffect(() => {
    if (!myId) return;
    updateDoc(doc(db, "users", myId), { lastSeen: serverTimestamp() }).catch(() => {});
  }, [myId]);

  /* ── Load other user ── */
  useEffect(() => {
    if (!otherId) return;
    (async () => {
      const fsSnap = await getDoc(doc(db, "users", otherId)).catch(() => null);
      const fsData = fsSnap?.exists() ? (fsSnap.data() as any) : null;
      const rawPic = fsData?.avatarPath || fsData?.profilePicture || fsData?.avatar;
      const avatarUrl = await resolveStorageURL(rawPic);
      const convSnap = await getDoc(doc(db, "chats", chatId)).catch(() => null as any);
      const convData = convSnap?.exists() ? (convSnap.data() as any) : null;
      setPinned(convData?.pinnedMessageIds || []);
      setIsBlocked((convData?.blockedBy || []).includes(myId));
      if (convData?.lastReadAt?.[otherId]) setOtherLastReadAt(convData.lastReadAt[otherId]);
      setOther({ id: otherId, name: fsData?.name || "Bilinmeyen", avatarUrl, lastSeen: fsData?.lastSeen });
    })();
  }, [otherId, chatId, myId]);

  /* ── Subscriptions (typing + chat meta) ── */
  useEffect(() => {
    if (!chatId || !otherId || !myId) return;
    const unsubTyping = onSnapshot(doc(db, `chats/${chatId}/typingStates/${otherId}`), (snap) => setTypingOther(!!snap.data()?.isTyping));
    const unsubConv = onSnapshot(doc(db, "chats", chatId), (snap) => {
      const d = snap.data() as any;
      if (d?.lastReadAt?.[otherId]) setOtherLastReadAt(d.lastReadAt[otherId]);
      setPinned(d?.pinnedMessageIds || []);
      setIsBlocked((d?.blockedBy || []).includes(myId));
    });
    return () => { unsubTyping(); unsubConv(); };
  }, [chatId, otherId, myId]);

  /* ── Load messages ── */
  const loadLatest = useCallback(async () => {
    if (!chatId) return;
    const col = collection(db, `chats/${chatId}/messages`);
    const snap = await getDocs(query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE)));
    setHasMore(snap.docs.length === PAGE_SIZE);
    setFirstCursor(snap.docs[snap.docs.length - 1] || null);
    setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as MsgBase) })).reverse() as Message[]);
    liveUnsubRef.current?.();
    const unsub = onSnapshot(query(col, orderBy("createdAt", "asc")), (live) => {
      const latest = live.docs.map(d => ({ id: d.id, ...(d.data() as MsgBase) })) as Message[];
      setMessages(prev => {
        const seen = new Set(prev.map(m => m.id));
        const merged = [...prev];
        for (const m of latest) if (!seen.has(m.id)) merged.push(m);
        return merged;
      });
    });
    liveUnsubRef.current = unsub;
  }, [chatId]);

  useEffect(() => { loadLatest(); return () => liveUnsubRef.current?.(); }, [loadLatest]);

  /* ── Load older on scroll top ── */
  const loadOlder = useCallback(async () => {
    if (!chatId || !hasMore || !firstCursor) return;
    const col = collection(db, `chats/${chatId}/messages`);
    const snap = await getDocs(query(col, orderBy("createdAt", "desc"), startAfter(firstCursor), limit(PAGE_SIZE)));
    setHasMore(snap.docs.length === PAGE_SIZE);
    setFirstCursor(snap.docs[snap.docs.length - 1] || null);
    setMessages(prev => [...snap.docs.map(d => ({ id: d.id, ...(d.data() as MsgBase) })).reverse() as Message[], ...prev]);
  }, [chatId, hasMore, firstCursor]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const h = () => { if (el.scrollTop <= 0) loadOlder(); };
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, [loadOlder]);

  /* ── Read receipts ── */
  useEffect(() => {
    if (!chatId || !myId) return;
    updateDoc(doc(db, "chats", chatId), { [`unread_${myId}`]: 0, [`lastReadAt.${myId}`]: serverTimestamp() }).catch(() => {});
  }, [chatId, myId, messages.length]);

  /* ── Draft ── */
  useEffect(() => { if (chatId) { const s = localStorage.getItem(`draft:${chatId}`); if (s) setText(s); } }, [chatId]);
  useEffect(() => { if (chatId) localStorage.setItem(`draft:${chatId}`, text); }, [chatId, text]);

  /* ── Voice recording ── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingTime;
        setRecordingTime(0);
        if (blob.size < 500) return; // too short
        setSending(true);
        try {
          const storageRef = ref(storage, `voice/${chatId}/${Date.now()}.webm`);
          const snap = await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(snap.ref);
          await sendOne({ type: "voice", text: "", audioUrl: url, audioDuration: duration });
        } finally { setSending(false); }
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert("Mikrofon erişimi reddedildi.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  /* ── Send helpers ── */
  const sendOne = async (payload: Partial<MsgBase> & { text: string }) => {
    if (!ready) return;
    const clean: any = { text: payload.text || "", senderId: myId, senderName: user?.name || "" };
    if (payload.type) clean.type = payload.type;
    if (payload.imageUrl) clean.imageUrl = payload.imageUrl;
    if (payload.audioUrl) clean.audioUrl = payload.audioUrl;
    if (payload.audioDuration !== undefined) clean.audioDuration = payload.audioDuration;
    if (payload.fileUrl) clean.fileUrl = payload.fileUrl;
    if (payload.fileName) clean.fileName = payload.fileName;
    if (payload.checkInData) clean.checkInData = payload.checkInData;
    if (payload.checkInRequestMsgId) clean.checkInRequestMsgId = payload.checkInRequestMsgId;
    if (payload.replyTo) clean.replyTo = payload.replyTo;

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages(prev => [...prev, { id: tempId, ...clean, pending: true }]);

    try {
      const docRef = await addDoc(collection(db, `chats/${chatId}/messages`), { ...clean, createdAt: serverTimestamp() });
      const preview = clean.text || (clean.imageUrl ? "[Resim]" : clean.audioUrl ? "[Sesli mesaj]" : clean.fileUrl ? `[${clean.fileName}]` : clean.type === "checkin_request" ? "[Check-in isteği]" : clean.type === "checkin_response" ? "[Check-in yanıtı]" : "");
      await updateDoc(doc(db, "chats", chatId), { lastMessage: preview, updatedAt: serverTimestamp(), [`unread_${otherId}`]: increment(1) });
      setMessages(prev => {
        const mapped = prev.map(m => m.id === tempId ? { ...m, id: docRef.id, pending: false } : m);
        const seen = new Set<string>();
        return mapped.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
      });
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, pending: false, error: true } : m));
    }
  };

  const handleSend = async () => {
    if (sending || !ready || recording) return;
    const trimmed = text.trim();
    if (!trimmed && files.length === 0 && docFiles.length === 0) return;
    setSending(true);
    try {
      for (const f of files) {
        const r2 = ref(storage, `chatImages/${chatId}/${Date.now()}_${f.name}`);
        const snap = await uploadBytes(r2, f);
        const url = await getDownloadURL(snap.ref);
        await sendOne({ type: "image", text: "", imageUrl: url, ...(replyTo ? { replyTo } : {}) });
      }
      for (const f of docFiles) {
        const r2 = ref(storage, `chatFiles/${chatId}/${Date.now()}_${f.name}`);
        const snap = await uploadBytes(r2, f);
        const url = await getDownloadURL(snap.ref);
        await sendOne({ type: "file", text: "", fileUrl: url, fileName: f.name, ...(replyTo ? { replyTo } : {}) });
      }
      if (trimmed) await sendOne({ type: "text", text: trimmed, ...(replyTo ? { replyTo } : {}) });
      setFiles([]); setDocFiles([]); setReplyTo(null); setText("");
    } finally { setSending(false); }
    await setDoc(doc(db, `chats/${chatId}/typingStates/${myId}`), { isTyping: false }).catch(() => {});
  };

  const sendCheckIn = async () => {
    await sendOne({ type: "checkin_request", text: "" });
  };

  const submitCheckInResponse = async (data: CheckInData) => {
    if (!activeCheckInMsg) return;
    await sendOne({ type: "checkin_response", text: "", checkInData: data, checkInRequestMsgId: activeCheckInMsg.id });
    setCheckInFormOpen(false); setActiveCheckInMsg(null);
  };

  const handleTyping = async (val: string) => {
    setText(val);
    if (chatId && myId) await setDoc(doc(db, `chats/${chatId}/typingStates/${myId}`), { isTyping: true }).catch(() => {});
  };

  const toggleReaction = async (m: Message, emoji: string) => {
    const has = m.reactions?.[emoji]?.includes(myId);
    const newMap = { ...(m.reactions || {}) };
    if (!newMap[emoji]) newMap[emoji] = [];
    newMap[emoji] = has ? newMap[emoji].filter(id => id !== myId) : [...newMap[emoji], myId];
    await updateDoc(doc(db, `chats/${chatId}/messages`, m.id), { reactions: newMap }).catch(() => {});
  };

  const deleteMine = async (m: Message) => {
    if (m.senderId !== myId) return;
    await updateDoc(doc(db, `chats/${chatId}/messages`, m.id), { deleted: true, text: "" }).catch(() => {});
  };

  const pinToggle = async (m: Message) => {
    const newPins = pinned.includes(m.id) ? pinned.filter(id => id !== m.id) : [...pinned, m.id];
    await updateDoc(doc(db, "chats", chatId), { pinnedMessageIds: newPins }).catch(() => {});
  };

  const blockToggle = async () => {
    const snap = await getDoc(doc(db, "chats", chatId));
    const arr: string[] = (snap.data() as any)?.blockedBy || [];
    await updateDoc(doc(db, "chats", chatId), { blockedBy: arr.includes(myId) ? arr.filter(x => x !== myId) : [...arr, myId] }).catch(() => {});
  };

  const retrySend = async (m: Message) => {
    setMessages(prev => prev.filter(x => x.id !== m.id));
    await sendOne({ type: m.type || "text", text: m.text, imageUrl: m.imageUrl, replyTo: m.replyTo });
  };

  /* ── Grouped messages ── */
  const grouped = useMemo(() => {
    const seenIds = new Set<string>();
    const deduped = messages.filter(m => { if (seenIds.has(m.id)) return false; seenIds.add(m.id); return true; });
    const base = queryText ? deduped.filter(m => (m.text || "").toLowerCase().includes(queryText.toLowerCase())) : deduped;
    const out: Array<{ type: "date" | "msg"; id: string; date?: string; msg?: Message }> = [];
    let lastDate = "";
    for (const m of base) {
      const d = m.createdAt?.toDate?.() || new Date();
      const chip = fmtDate(d);
      if (chip !== lastDate) { out.push({ type: "date", id: `d-${d.getTime()}`, date: chip }); lastDate = chip; }
      out.push({ type: "msg", id: m.id, msg: m });
    }
    return out;
  }, [messages, queryText]);

  const isReadByOther = (m: Message) => !!(otherLastReadAt && m.createdAt && otherLastReadAt.toMillis() >= m.createdAt.toMillis());

  const renderTicks = (m: Message) => {
    if (m.pending) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (m.error) return null;
    return isReadByOther(m)
      ? <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
      : <Check className="h-3.5 w-3.5 opacity-60" />;
  };

  /* ─────────────────────────────── Render ────────────────────────────── */

  return (
    <div className="flex flex-col h-full min-h-0 max-w-3xl mx-auto">
      {/* Header */}
      <div className="shrink-0 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="text-primary hover:opacity-80 flex items-center gap-1 shrink-0">
            <ArrowLeft size={18} />
          </Link>
          {/* Avatar */}
          <div className="relative w-9 h-9 shrink-0">
            {other?.avatarUrl && /^https?:\/\//.test(other.avatarUrl)
              ? <Image src={other.avatarUrl} alt={other?.name || ""} fill sizes="36px" className="rounded-xl object-cover" unoptimized onError={() => {}} />
              : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white text-xs font-semibold flex items-center justify-center">{initials(other?.name)}</div>}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{other?.name || "Yükleniyor…"}</p>
            <p className="text-[11px] text-muted-foreground">
              {typingOther ? "Yazıyor…" : other?.lastSeen ? `Son görülme ${other.lastSeen.toDate().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : "Çevrimdışı"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg hover:bg-muted"><Search className="w-4 h-4" /></button>
            <details className="relative">
              <summary className="list-none p-2 rounded-lg hover:bg-muted cursor-pointer"><MoreVertical className="w-4 h-4" /></summary>
              <div className="absolute right-0 mt-1 w-48 border border-border rounded-xl bg-background shadow-xl p-1 z-30">
                <button onClick={blockToggle} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2 text-sm">
                  <Ban className="w-4 h-4" /> {isBlocked ? "Engeli Kaldır" : "Engelle"}
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2 text-sm">
                  <Flag className="w-4 h-4" /> Rapor Et
                </button>
              </div>
            </details>
          </div>
        </div>
        {searchOpen && (
          <div className="mt-2 flex items-center gap-2">
            <input value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Bu sohbette ara…"
              className="flex-1 h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={() => { setSearchOpen(false); setQueryText(""); }} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
        )}
        {/* Pinned ribbon */}
        {pinned.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {pinned.map(id => {
              const msg = messages.find(m => m.id === id);
              if (!msg) return null;
              return (
                <button key={id} onClick={() => document.querySelector(`[data-msg="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 whitespace-nowrap shrink-0">
                  📌 {msg.text?.slice(0, 28) || "[Medya]"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 py-4 space-y-2 bg-zinc-50 dark:bg-zinc-900">
        {hasMore && (
          <div className="flex justify-center">
            <button onClick={loadOlder} className="text-xs text-primary hover:underline px-3 py-1">Önceki mesajları yükle</button>
          </div>
        )}
        {grouped.map(row =>
          row.type === "date" ? (
            <div key={row.id} className="flex justify-center sticky top-2 z-10">
              <span className="text-[11px] px-3 py-1 rounded-full bg-background/80 backdrop-blur border border-border text-muted-foreground shadow-sm">{row.date}</span>
            </div>
          ) : (
            <MessageBubble
              key={row.id}
              msg={row.msg!}
              mine={row.msg!.senderId === myId}
              myId={myId}
              myRole={myRole}
              otherName={other?.name || ""}
              pinned={pinned}
              checkInResponded={checkInResponseMap.has(row.msg!.id)}
              onReply={m => setReplyTo({ id: m.id, text: m.text, imageUrl: m.imageUrl, senderName: m.senderId === myId ? (user?.name || "Sen") : (other?.name || "") })}
              onCopy={async t => { await navigator.clipboard.writeText(t).catch(() => {}); }}
              onDelete={deleteMine}
              onPin={pinToggle}
              onReact={toggleReaction}
              onRetry={retrySend}
              onOpenImage={setLightbox}
              onCheckInRespond={m => { setActiveCheckInMsg(m); setCheckInFormOpen(true); }}
              readTicks={renderTicks(row.msg!)}
            />
          )
        )}
        {typingOther && (
          <div className="flex justify-start px-4">
            <div className="bg-card dark:bg-zinc-800 border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-background px-3 py-3 space-y-2">
        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-start gap-2 bg-muted/60 rounded-xl p-2.5 text-xs">
            <CornerUpLeft className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{replyTo.senderName}</p>
              <p className="truncate text-muted-foreground">{replyTo.text || (replyTo.imageUrl ? "[Resim]" : "")}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="shrink-0 p-0.5 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Image previews */}
        {(files.length > 0 || docFiles.length > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {files.map((f, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
                <img src={URL.createObjectURL(f)} alt="" className="object-cover w-full h-full" />
                <button onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 bg-foreground/70 text-white rounded-full h-5 w-5 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {docFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 shrink-0 text-xs">
                <FileText className="w-4 h-4 text-primary" />
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => setDocFiles(p => p.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Recording indicator */}
        {recording && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400 flex-1">Kaydediliyor… {fmtTime(recordingTime)}</span>
            <button onClick={stopRecording} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">Gönder</button>
            <button onClick={() => { mediaRecorderRef.current?.stop(); setRecording(false); if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); setRecordingTime(0); audioChunksRef.current = []; }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Input row */}
        {!recording && (
          <div className="flex items-center gap-2">
            {/* Popups above input */}
            <div className="relative">
              <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowTemplates(false); }}
                className={`p-2 rounded-xl hover:bg-muted transition ${showEmojiPicker ? "bg-muted" : ""}`}>
                <Smile className="w-5 h-5 text-muted-foreground" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-40">
                  <EmojiPickerPanel forInput onPick={e => { setText(t => t + e); inputRef.current?.focus(); setShowEmojiPicker(false); }} />
                </div>
              )}
            </div>

            {myRole === "coach" && (
              <div className="relative">
                <button onClick={() => { setShowTemplates(!showTemplates); setShowEmojiPicker(false); }}
                  className={`p-2 rounded-xl hover:bg-muted transition ${showTemplates ? "bg-muted" : ""}`}>
                  <Zap className="w-5 h-5 text-muted-foreground" />
                </button>
                {showTemplates && (
                  <div className="absolute bottom-12 left-0 z-40">
                    <TemplatesPanel onSelect={t => { setText(t); setShowTemplates(false); inputRef.current?.focus(); }} />
                  </div>
                )}
              </div>
            )}

            <input
              ref={inputRef}
              value={text}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              onPaste={e => {
                const picked: File[] = [];
                for (const item of Array.from(e.clipboardData?.items || [])) {
                  if (item.kind === "file") { const f = item.getAsFile(); if (f) picked.push(f); }
                }
                if (picked.length) setFiles(p => [...p, ...picked]);
              }}
              placeholder={isBlocked ? "Bu sohbet engellendi" : "Mesaj yaz…"}
              disabled={isBlocked || !ready}
              className="flex-1 border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
            />

            {/* Attachments */}
            <label className="cursor-pointer p-2 rounded-xl hover:bg-muted transition">
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => setFiles(p => [...p, ...Array.from(e.target.files || [])])} />
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </label>
            <label className="cursor-pointer p-2 rounded-xl hover:bg-muted transition">
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple className="hidden"
                onChange={e => setDocFiles(p => [...p, ...Array.from(e.target.files || [])])} />
              <FileText className="w-5 h-5 text-muted-foreground" />
            </label>

            {/* Mic / Check-in (coach) / Send */}
            {myRole === "coach" && (
              <button onClick={sendCheckIn} title="Check-in isteği gönder"
                className="p-2 rounded-xl hover:bg-muted transition text-muted-foreground">
                <span className="text-base">📋</span>
              </button>
            )}

            {text.trim() || files.length > 0 || docFiles.length > 0 ? (
              <button onClick={handleSend} disabled={sending || isBlocked}
                className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-2xl p-2.5 transition">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            ) : (
              <button onClick={startRecording} disabled={!ready}
                className="p-2.5 rounded-2xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground transition">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      {checkInFormOpen && <CheckInFormModal onClose={() => { setCheckInFormOpen(false); setActiveCheckInMsg(null); }} onSubmit={submitCheckInResponse} />}
    </div>
  );
}
