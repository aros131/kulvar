// src/app/dashboard/user/profile/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";

import UserPageShell from "@/components/user/UserPageShell";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, CalendarDays, BadgeCheck, ShieldAlert, Target, User as UserIcon, Flame, TrendingUp, Ruler } from "lucide-react";
import Link from "next/link";

import ProfileImageUploader from "@/components/ProfileImageUploader";
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";
import { GOAL_TYPES, WEIGHT_GOALS, weightGoalProgress, type GoalType } from "@/lib/fitnessGoals";

async function resolveAvatarUrl(input?: string): Promise<string> {
  // No real photo yet (either unset, or the backend's placeholder default) —
  // return "" so the caller falls back to the initials avatar instead of a
  // generic circular icon that doesn't fill its square frame.
  if (!input || input.includes("default-user")) return "";
  if (/^https?:\/\//i.test(input)) return input;
  // A root-relative path is a local /public asset, not a Firebase Storage
  // key — serve it directly instead of round-tripping through Storage.
  if (/^\//.test(input) && !/^gs:\/\//i.test(input)) return input;
  try {
    const path = /^gs:\/\//i.test(input) ? input : input.replace(/^\/+/, "");
    return await getDownloadURL(sRef(storage, path));
  } catch {
    return "";
  }
}

function formatMemberSince(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(d);
}

/* ------------------------------- Types ------------------------------- */
type UserProfile = {
  name: string;
  email: string;
  profilePicture: string;
  fitnessGoals?: string;
  fitnessGoalType?: string;
  goalStartWeight?: number | null;
  goalTargetWeight?: number | null;
  height?: number | null;
  currentWeight?: number | null;
  bio?: string;
  city?: string;
  emailVerified?: boolean;
  createdAt?: string;
};

type ProgramProgress = {
  programId: string;
  name: string;
  coachName?: string;
  progressPercentage: number;
};

type Streaks = { currentStreak: number; longestStreak: number };

/* ------------------------------- Config ------------------------------ */
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

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

  const [programProgress, setProgramProgress] = useState<ProgramProgress[]>([]);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

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

  // Fetch real progress data (assigned-program completion + streaks) to back
  // the "İlerlemem" card with actual logged activity instead of static text.
  useEffect(() => {
    if (token === undefined) return;
    if (!token) {
      setProgressLoading(false);
      return;
    }
    const run = async () => {
      try {
        const stored = localStorage.getItem("user");
        const userId: string | undefined = stored ? JSON.parse(stored)?.id : undefined;

        const [progressRes, streaksRes] = await Promise.allSettled([
          fetch(`${API}/progress/all-program-progress`, { headers: authHeaders as HeadersInit, cache: "no-store" }),
          userId
            ? fetch(`${API}/progress/streaks/${userId}`, { headers: authHeaders as HeadersInit, cache: "no-store" })
            : Promise.resolve(null),
        ]);

        if (progressRes.status === "fulfilled" && progressRes.value?.ok) {
          const data = await progressRes.value.json().catch(() => ({} as any));
          setProgramProgress(Array.isArray(data?.programProgress) ? data.programProgress : []);
        }

        if (streaksRes.status === "fulfilled" && streaksRes.value?.ok) {
          const data = await streaksRes.value.json().catch(() => ({} as any));
          setStreaks({
            currentStreak: Number(data?.currentStreak) || 0,
            longestStreak: Number(data?.longestStreak) || 0,
          });
        }
      } catch {
        // Non-critical widget — fail quietly and just show the empty state.
      } finally {
        setProgressLoading(false);
      }
    };
    run();
  }, [token, authHeaders]);

  const handleEditChange = (field: keyof UserProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleWeightChange = (field: "goalStartWeight" | "goalTargetWeight" | "height", value: string) => {
    if (!editData) return;
    const num = value === "" ? null : Number(value);
    setEditData({ ...editData, [field]: Number.isNaN(num as number) ? editData[field] : num });
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
      // The backend only echoes back a subset of fields on save — merge onto
      // what we already have locally instead of dropping the rest (email,
      // emailVerified, createdAt aren't part of the update response).
      setProfile((prev) => (prev ? { ...prev, ...(res.data?.user ?? res.data) } : (res.data?.user ?? res.data)));
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

  const memberSince = formatMemberSince(profile?.createdAt);

  return (
    <UserPageShell unreadCount={unreadCount}>
      <section className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil Bilgileri</h1>
            <p className="text-sm text-muted-foreground">Bilgilerini güncel tutarak deneyimini kişiselleştir.</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" disabled={!profile}>Profili Düzenle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Profili Düzenle</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-2">
                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Profil Fotoğrafı</label>
                  <ProfileImageUploader onCropped={handleImageUpload} />
                  {uploading && <p className="text-xs text-muted-foreground">Yükleniyor…</p>}

                  {editData?.profilePicture && !editData.profilePicture.includes("default-user") ? (
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

                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">İsim</label>
                  <Input
                    placeholder="İsim"
                    value={editData?.name || ""}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">Şehir</label>
                    <Input
                      placeholder="Örn. İzmir"
                      value={editData?.city || ""}
                      onChange={(e) => handleEditChange("city", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">Boy (cm)</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Örn. 168"
                      value={editData?.height ?? ""}
                      onChange={(e) => handleWeightChange("height", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Hakkımda</label>
                  <Textarea
                    placeholder="Koçunun seni tanıması için birkaç cümle yaz."
                    value={editData?.bio || ""}
                    onChange={(e) => handleEditChange("bio", e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <span className="text-[11px] text-muted-foreground text-right">
                    {(editData?.bio || "").length}/500
                  </span>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Hedef Türü</label>
                  <Select
                    value={editData?.fitnessGoalType || undefined}
                    onValueChange={(v) => handleEditChange("fitnessGoalType", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Bir hedef seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editData?.fitnessGoalType && WEIGHT_GOALS.includes(editData.fitnessGoalType as GoalType) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Başlangıç Kilo (kg)</label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Örn. 72"
                        value={editData?.goalStartWeight ?? ""}
                        onChange={(e) => handleWeightChange("goalStartWeight", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Hedef Kilo (kg)</label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Örn. 65"
                        value={editData?.goalTargetWeight ?? ""}
                        onChange={(e) => handleWeightChange("goalTargetWeight", e.target.value)}
                      />
                    </div>
                    <p className="col-span-2 text-[11px] text-muted-foreground -mt-1">
                      Güncel kilon check-in'lerinden otomatik alınır — ayrıca girmene gerek yok.
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Ek Notlar</label>
                  <Textarea
                    placeholder="Örn. haftada 4 gün antrenman yapmak, dizimde eski bir sakatlık var…"
                    value={editData?.fitnessGoals || ""}
                    onChange={(e) => handleEditChange("fitnessGoals", e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
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

        {/* Hero */}
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
                className="flex flex-col sm:flex-row sm:items-center gap-4"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-semibold leading-none">{profile.name}</span>
                    {profile.emailVerified ? (
                      <Badge variant="secondary" className="gap-1 text-emerald-700 dark:text-emerald-400">
                        <BadgeCheck className="h-3 w-3" /> E-posta doğrulandı
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-amber-700 dark:text-amber-400">
                        <ShieldAlert className="h-3 w-3" /> E-posta doğrulanmadı
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground break-all">{profile.email}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    {profile.city ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {profile.city}
                      </span>
                    ) : null}
                    {profile.height ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" /> {profile.height} cm
                      </span>
                    ) : null}
                    {memberSince ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" /> {memberSince}'den beri üye
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-sm text-muted-foreground">Profil bulunamadı.</div>
            )}
          </CardContent>
        </Card>

        {!loading && profile && (
          <>
            {/* About */}
            <Card className="rounded-2xl">
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Hakkımda</h2>
                </div>
                {profile.bio ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Henüz bir açıklama eklemedin.{" "}
                    <button className="text-primary hover:underline" onClick={() => setDialogOpen(true)}>
                      Şimdi ekle
                    </button>
                    , koçun seni daha iyi tanısın.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fitness goals */}
            <Card className="rounded-2xl">
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Fitness Hedeflerim</h2>
                </div>

                {profile.fitnessGoalType || profile.fitnessGoals ? (
                  <div className="space-y-4">
                    {profile.fitnessGoalType && (
                      <Badge variant="secondary" className="text-sm font-medium">{profile.fitnessGoalType}</Badge>
                    )}

                    {(() => {
                      const pct = weightGoalProgress(
                        profile.fitnessGoalType,
                        profile.goalStartWeight,
                        profile.goalTargetWeight,
                        profile.currentWeight
                      );
                      if (pct === null) return null;
                      const current = profile.currentWeight ?? profile.goalStartWeight;
                      return (
                        <div>
                          <div className="flex items-baseline justify-between gap-2 mb-1.5">
                            <span className="text-sm font-medium">Kilo hedefine ilerleme</span>
                            <span className="text-xs text-muted-foreground shrink-0">%{pct}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                            <span>Başlangıç: {profile.goalStartWeight} kg</span>
                            <span className="font-medium text-foreground">Güncel: {current} kg</span>
                            <span>Hedef: {profile.goalTargetWeight} kg</span>
                          </div>
                          {profile.currentWeight == null && (
                            <p className="text-[11px] text-muted-foreground mt-2">
                              Henüz check-in'inde kilo girmedin, o yüzden başlangıç kilon kullanılıyor.{" "}
                              <Link href="/dashboard/user/check-in" className="text-primary hover:underline">
                                Check-in yap
                              </Link>{" "}
                              ve gerçek ilerlemeni gör.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {profile.fitnessGoals && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{profile.fitnessGoals}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Henüz bir hedef belirlemedin.{" "}
                    <button className="text-primary hover:underline" onClick={() => setDialogOpen(true)}>
                      Şimdi ekle
                    </button>
                    , koçun sana özel bir program hazırlarken kullansın.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Real progress — ties the goal above to what's actually logged */}
            <Card className="rounded-2xl">
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">İlerlemem</h2>
                </div>

                {progressLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {(streaks && (streaks.currentStreak > 0 || streaks.longestStreak > 0)) && (
                      <div className="flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="text-lg font-bold leading-none">{streaks.currentStreak} gün</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">Güncel seri</div>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                          <div className="text-lg font-bold leading-none">{streaks.longestStreak} gün</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">En uzun seri</div>
                        </div>
                      </div>
                    )}

                    {programProgress.length > 0 ? (
                      <div className="space-y-4">
                        {programProgress.map((p) => (
                          <div key={p.programId}>
                            <div className="flex items-baseline justify-between gap-2 mb-1.5">
                              <span className="text-sm font-medium truncate">{p.name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                %{Math.round(p.progressPercentage)}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
                                style={{ width: `${Math.min(100, Math.max(0, p.progressPercentage))}%` }}
                              />
                            </div>
                            {p.coachName && (
                              <div className="text-[11px] text-muted-foreground mt-1">Koç: {p.coachName}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Henüz bir programa katılmadın.{" "}
                        <Link href="/dashboard/user/koclarimiz" className="text-primary hover:underline">
                          Koçları keşfet
                        </Link>{" "}
                        ve ilk programını başlat — ilerlemen burada canlı olarak görünmeye başlar.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </UserPageShell>
  );
}
