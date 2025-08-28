// src/app/dashboard/user/profile/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";

import SidebarNavUser from "@/components/ui/SidebarNavUser";
import UserNavbar from "@/components/nav/UserNavbar";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import ProfileImageUploader from "@/components/ProfileImageUploader";

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
  const [token, setToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editData, setEditData] = useState<UserProfile | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // keep token in state + react to cross-tab changes
  useEffect(() => {
    setToken(cleanToken());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(cleanToken());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          toast.error("Kullanıcı giriş yapmamış.");
          setLoading(false);
          return;
        }
        const response = await axios.get(`${API}/profile`, { headers: authHeaders });
        setProfile(response.data);
        setEditData(response.data);
      } catch (err) {
        toast.error("Profil yüklenirken bir hata oluştu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, authHeaders]);

  // Fetch unread notifications (for sidebar badge)
  useEffect(() => {
    const fetchUnread = async () => {
      if (!token) {
        setUnreadCount(0);
        return;
      }
      try {
        const r = await fetch(`${API}/dashboard/notifications/user`, {
          headers: authHeaders as HeadersInit,
          cache: "no-store",
        });
        const data = await r.json().catch(() => ({} as any));
        const list: any[] = Array.isArray(data?.notifications) ? data.notifications : [];
        setUnreadCount(list.filter((n) => !n?.isRead).length);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchUnread();
  }, [token, authHeaders]);

  const handleEditChange = (field: keyof UserProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !editData) return;
    setUploading(true);
    try {
      const emailSafe = editData.email.replace(/[@.]/g, "_");
      const fileRef = ref(storage, `profile-pictures/${emailSafe}/${uuidv4()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setEditData((prev) => (prev ? { ...prev, profilePicture: downloadURL } : prev));
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
      setProfile(res.data);
      setDialogOpen(false);
      toast.success("Profil başarıyla güncellendi.");
    } catch (err) {
      toast.error("Profil güncellenemedi.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex">
      {/* Left sidebar — content offset by md:ml-16 below so it never overlays */}
      <SidebarNavUser unreadCount={unreadCount} />

      <main className="w-full min-h-screen ml-0 md:ml-16 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <UserNavbar />

        {/* Decorative gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.22),rgba(16,185,129,0)_60%)]"
        />

        <section className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil Bilgileri</h1>
              <p className="text-sm text-muted-foreground">Bilgilerini güncel tutarak deneyimini kişiselleştir.</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Profili Düzenle</Button>
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
                      <div className="mt-1">
                        {/* Rounded-square preview (NOT circle) */}
                        <Image
                          src={editData.profilePicture}
                          alt="Yeni Profil"
                          width={100}
                          height={100}
                          className="rounded-2xl object-cover w-[100px] h-[100px] border"
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
                  <Button onClick={handleSave} disabled={saving || uploading}>
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
                  {/* Rounded-square avatar with subtle glow */}
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                    <Image
                      src={profile.profilePicture || "/images/default-user.jpg"}
                      alt="Profil Fotoğrafı"
                      width={96}
                      height={96}
                      className="relative rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 w-[96px] h-[96px]"
                      unoptimized
                    />
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
        </section>
      </main>
    </div>
  );
}
