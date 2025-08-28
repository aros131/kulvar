// src/app/dashboard/coach/profile/page.tsx (or your current path)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import ProfileImageUploader from "@/components/ProfileImageUploader";

import { Mail, BadgeCheck, PencilLine, User } from "lucide-react";

/* --------------------------------- Config --------------------------------- */
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

/* ------------------------------ Helper Utils ------------------------------ */
/** Hardened token read: trims quotes, handles 'Bearer ' prefix */
const cleanToken = (): string | null => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    const val = trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
    return val || null;
  } catch {
    return null;
  }
};

interface CoachProfile {
  name: string;
  email: string;
  profilePicture: string;
  specialization?: string;
  role: "coach";
}

const CoachProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [editData, setEditData] = useState<CoachProfile | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const authHeader = useMemo(() => {
    const token = cleanToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/profile`, { headers: authHeader });
        if (res.data?.role !== "coach") throw new Error("Not a coach profile");
        setProfile(res.data);
        setEditData(res.data);
      } catch (err) {
        toast.error("Profil yüklenemedi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authHeader]);

  const handleEditChange = (field: keyof CoachProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !editData) return;
    setUploading(true);
    try {
      const emailSafe = (editData.email || "user").replace(/[@.]/g, "_");
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
    if (!editData.name?.trim()) {
      toast.error("İsim alanı boş bırakılamaz.");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile`, editData, { headers: authHeader });
      setProfile(res.data);
      setDialogOpen(false);
      toast.success("Profil güncellendi.");
    } catch (err) {
      toast.error("Profil güncellenemedi.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Decorative gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.22),rgba(16,185,129,0)_60%)]"
      />

      <section className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil Bilgileri</h1>
            <p className="text-sm text-muted-foreground">Bilgilerini güncel tutarak öne çık.</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <PencilLine className="h-4 w-4" />
                Profili Düzenle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Profili Düzenle</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs text-muted-foreground">İsim</label>
                  <Input
                    placeholder="İsim"
                    value={editData?.name || ""}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs text-muted-foreground">Branş</label>
                  <Input
                    placeholder="Branş"
                    value={editData?.specialization || ""}
                    onChange={(e) => handleEditChange("specialization", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Profil Fotoğrafı</label>
                  <ProfileImageUploader onCropped={handleImageUpload} />
                  {uploading && <p className="text-xs text-muted-foreground">Yükleniyor…</p>}

                  {editData?.profilePicture ? (
                    <div className="mt-1">
                      {/* Rounded-square preview */}
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
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : profile ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-4"
              >
                {/* Rounded-square avatar */}
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                  <Image
                    src={profile.profilePicture || "/images/user.png"}
                    alt="Profil Fotoğrafı"
                    width={96}
                    height={96}
                    className="relative rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 w-[96px] h-[96px]"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl leading-none">{profile.name}</CardTitle>
                    <Badge variant="secondary" className="gap-1 rounded-lg">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Doğrulandı
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {profile.specialization || "Belirtilmemiş"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-sm text-muted-foreground">Profil bulunamadı.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CoachProfilePage;
