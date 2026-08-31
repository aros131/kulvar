// src/app/dashboard/coach/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import ProfileImageUploader from "@/components/ProfileImageUploader";

import { Mail, BadgeCheck, PencilLine, User, MapPin, Quote, Award, X, BarChart2, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";
import CoachPageShell from "@/components/coach/CoachPageShell";

/* --------------------------------- Config --------------------------------- */
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

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

interface CoachProfile {
  name: string;
  email: string;
  profilePicture: string;
  specialization?: string;
  bio?: string;
  tagline?: string;
  certifications?: string[];
  city?: string;
  role: "coach";
}

const CoachProfilePage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [editData, setEditData] = useState<CoachProfile | null>(null);
  const [certInput, setCertInput] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = cleanToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
  }, []);

  const handleEditChange = (field: keyof CoachProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const addCertification = () => {
    const val = certInput.trim();
    if (!val || !editData) return;
    if ((editData.certifications || []).includes(val)) return;
    setEditData({ ...editData, certifications: [...(editData.certifications || []), val] });
    setCertInput("");
  };

  const removeCertification = (cert: string) => {
    if (!editData) return;
    setEditData({ ...editData, certifications: (editData.certifications || []).filter((c) => c !== cert) });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const token = cleanToken();
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
      const token = cleanToken();
      const res = await axios.put(`${API}/profile`, editData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const updated = res.data?.user ?? res.data;
      setProfile(updated);
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
    <CoachPageShell>
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
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Profili Düzenle</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-2">
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">İsim *</label>
                  <Input
                    placeholder="Adınız Soyadınız"
                    value={editData?.name || ""}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Kısa Slogan</label>
                  <Input
                    placeholder="örn. Güç ve kondisyon uzmanı"
                    value={editData?.tagline || ""}
                    onChange={(e) => handleEditChange("tagline", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Uzmanlık Alanı</label>
                  <Select
                    value={editData?.specialization || ""}
                    onValueChange={(v) => handleEditChange("specialization", v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Belirtilmemiş —</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="pilates">Pilates</SelectItem>
                      <SelectItem value="beslenme">Beslenme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Şehir</label>
                  <Input
                    placeholder="örn. İstanbul"
                    value={editData?.city || ""}
                    onChange={(e) => handleEditChange("city", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Hakkımda</label>
                  <Textarea
                    placeholder="Kendinizi ve yaklaşımınızı anlatın..."
                    rows={4}
                    value={editData?.bio || ""}
                    onChange={(e) => handleEditChange("bio", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Sertifikalar</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="örn. ACE Personal Trainer"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCertification(); } }}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addCertification}>
                      Ekle
                    </Button>
                  </div>
                  {(editData?.certifications || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(editData?.certifications || []).map((cert) => (
                        <span key={cert} className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-primary/90 rounded-lg px-2 py-1">
                          {cert}
                          <button onClick={() => removeCertification(cert)} className="text-muted-foreground hover:text-muted-foreground">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">Profil Fotoğrafı</label>
                  <ProfileImageUploader onCropped={handleImageUpload} />
                  {uploading && <p className="text-xs text-muted-foreground">Yükleniyor…</p>}
                  {editData?.profilePicture ? (
                    <Image
                      src={editData.profilePicture}
                      alt="Yeni Profil"
                      width={100}
                      height={100}
                      className="rounded-2xl object-cover w-[100px] h-[100px] border"
                      unoptimized
                    />
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
                className="space-y-6"
              >
                {/* Avatar + name row */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                    <Image
                      src={profile.profilePicture || "/images/user.png"}
                      alt="Profil Fotoğrafı"
                      width={96}
                      height={96}
                      className="relative rounded-2xl object-cover border border-border dark:border-zinc-800 w-[96px] h-[96px]"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl leading-none">{profile.name}</CardTitle>
                      <Badge variant="secondary" className="gap-1 rounded-lg">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Doğrulandı
                      </Badge>
                    </div>
                    {profile.tagline && (
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{profile.tagline}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {profile.email}
                      </span>
                      {profile.specialization && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {profile.specialization}
                        </span>
                      )}
                      {profile.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Quote className="h-3.5 w-3.5" /> Hakkımda
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Certifications */}
                {(profile.certifications || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> Sertifikalar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.certifications || []).map((cert) => (
                        <Badge key={cert} variant="outline" className="rounded-lg">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty prompts */}
                {!profile.bio && !profile.tagline && (profile.certifications || []).length === 0 && (
                  <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Profilini zenginleştir — bio, slogan ve sertifikalarını ekle.
                  </div>
                )}
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
              { href: "/dashboard/coach/analytics", label: "Analitik", Icon: BarChart2 },
              { href: "/dashboard/coach/payments", label: "Ödemeler", Icon: CreditCard },
              { href: "/dashboard/coach/settings", label: "Ayarlar", Icon: Settings },
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
    </CoachPageShell>
  );
};

export default CoachProfilePage;
