// src/app/dashboard/user/profile/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";

import UserPageShell from "@/components/user/UserPageShell";

import Link from "next/link";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";

import ProfileImageUploader from "@/components/ProfileImageUploader";
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";

async function resolveAvatarUrl(input?: string): Promise<string> {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  try {
    const path = /^gs:\/\//i.test(input) ? input : input.replace(/^\/+/, "");
    return await getDownloadURL(sRef(storage, path));
  } catch {
    return "";
  }
}

/* ------------------------------- Types ------------------------------- */
type UserProfile = {
  name: string;
  email: string;
  profilePicture: string;
  fitnessGoals?: string;
};

/* ------------------------------- Config ------------------------------ */
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

/* ------------------------------ Utilities --------------------------- */
const cleanToken = (): string | null => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  } catch {
    return null;
  }
};

/* ------------------------------ Page --------------------------- */
export default function UserProfilePage() {
  const router = useRouter();
  // undefined = not checked yet; null = checked and no token; string = token
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editData, setEditData] = useState<UserProfile | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // resolve token once (and on storage changes)
  useEffect(() => {
    setToken(cleanToken() ?? null);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(cleanToken() ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // Fetch profile only after token state is known
  useEffect(() => {
    if (token === undefined) return; // wait until we know
    if (!token) {
      setLoading(false); // not logged in; just stop loading silently
      return;
    }
    const run = async () => {
      try {
        const res = await axios.get(`${API}/profile`, { headers: authHeaders });
        setProfile(res.data);
        setEditData(res.data);
        const url = await resolveAvatarUrl(res.data?.profilePicture);
        setAvatarUrl(url);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) toast.error("Oturumunuz geçersiz. Lütfen tekrar giriş yapın.");
        else toast.error("Profil yüklenirken bir hata oluştu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, authHeaders]);

  // Fetch unread notifications (for sidebar badge)
  useEffect(() => {
    if (token === undefined) return;
    if (!token) {
      setUnreadCount(0);
      return;
    }
    const run = async () => {
      try {
        const r = await fetch(`${API}/dashboard/notifications/user`, {
          headers: authHeaders as HeadersInit,
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`status_${r.status}`);
        const data = await r.json().catch(() => ({} as any));
        const list: any[] = Array.isArray(data?.notifications) ? data.notifications : [];
        setUnreadCount(list.filter((n) => !n?.isRead).length);
      } catch {
        setUnreadCount(0);
      }
    };
    run();
  }, [token, authHeaders]);

  const handleEditChange = (field: keyof UserProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${API}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEditData((prev) => (prev ? { ...prev, profilePicture: data.url } : prev));
      const resolved = await resolveAvatarUrl(data.url);
      setAvatarUrl(resolved);
      toast.success("Fotoğraf yüklendi.");
    } catch (err) {
      toast.error("Fotoğraf yüklenemedi.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    if (!editData.name.trim()) {
      toast.error("İsim alanı boş bırakılamaz.");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile`, editData, { headers: authHeaders });
      setProfile(res.data?.user ?? res.data);
      setDialogOpen(false);
      toast.success("Profil başarıyla güncellendi.");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) toast.error("Oturumunuz geçersiz. Lütfen tekrar giriş yapın.");
      else toast.error("Profil güncellenemedi.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserPageShell unreadCount={unreadCount}>
      <section className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil Bilgileri</h1>
              <p className="text-sm text-muted-foreground">Bilgilerini güncel tutarak deneyimini kişiselleştir.</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" disabled={!profile}>Profili Düzenle</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Profili Düzenle</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">İsim</label>
                    <Input
                      placeholder="İsim"
                      value={editData?.name || ""}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">Fitness Hedefleri</label>
                    <Input
                      placeholder="Fitness Hedefleri"
                      value={editData?.fitnessGoals || ""}
                      onChange={(e) => handleEditChange("fitnessGoals", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">Profil Fotoğrafı</label>
                    <ProfileImageUploader onCropped={handleImageUpload} />
                    {uploading && <p className="text-xs text-muted-foreground">Yükleniyor…</p>}

                    {editData?.profilePicture ? (
                      <div className="mt-1 w-[80px] h-[80px] rounded-xl overflow-hidden border">
                        <Image
                          src={editData.profilePicture}
                          alt="Yeni Profil"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <DialogFooter className="mt-4 gap-2">
                  <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving || uploading}>
                    İptal
                  </Button>
                  <Button onClick={handleSave} disabled={saving || uploading || !editData}>
                    {saving ? "Kaydediliyor…" : "Kaydet"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-2xl">
            <CardContent className="py-6">
              {loading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-[96px] w-[96px] rounded-2xl" />
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ) : profile ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                    <div className="relative w-[96px] h-[96px] rounded-2xl overflow-hidden border border-border dark:border-zinc-800">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profil Fotoğrafı"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold select-none">
                            {profile.name?.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-semibold leading-none">{profile.name}</div>
                    <p className="text-sm text-muted-foreground break-all">{profile.email}</p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Fitness Hedefleri:</span>{" "}
                      {profile.fitnessGoals || "Belirtilmemiş"}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-sm text-muted-foreground">Profil bulunamadı.</div>
              )}
            </CardContent>
          </Card>
        {/* Mobile-only quick links */}
        <div className="md:hidden mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Diğer</p>
          <div className="rounded-2xl border overflow-hidden divide-y">
            {[
              { href: "/dashboard/user/koclarimiz", label: "Koçlarım", Icon: Users },
              { href: "/dashboard/user/payments", label: "Ödemelerim", Icon: CreditCard },
              { href: "/dashboard/user/settings", label: "Ayarlar", Icon: Settings },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-3.5 bg-card hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
                router.push("/login");
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-card hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </UserPageShell>
  );
}
