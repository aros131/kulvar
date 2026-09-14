// src/app/dashboard/coach/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

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
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

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
  isVerifiedCoach?: boolean;
  coachVerification?: {
    status: "none" | "pending" | "approved" | "rejected";
    certificateUrl?: string;
    instagram?: string;
  };
}

const CoachProfilePage: React.FC = () => {
  const t = useTranslations("profileCoach");
  const tSpec = useTranslations("coachesDirectory");
  const specLabels: Record<string, string> = {
    fitness: tSpec("specLabels.fitness"),
    yoga: tSpec("specLabels.yoga"),
    pilates: tSpec("specLabels.pilates"),
    beslenme: tSpec("specLabels.beslenme"),
  };
  const router = useRouter();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [editData, setEditData] = useState<CoachProfile | null>(null);
  const [certInput, setCertInput] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [certUrl, setCertUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);

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
        toast.error(t("loadError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.success(t("photoUploaded"));
    } catch (err) {
      toast.error(t("photoUploadError"));
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const submitVerificationRequest = async () => {
    if (!certUrl.trim() && !instagramHandle.trim()) {
      toast.error(t("verificationFieldRequired"));
      return;
    }
    setSubmittingVerification(true);
    try {
      const token = cleanToken();
      const res = await fetch(`${API}/profile/verification-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ certificateUrl: certUrl, instagram: instagramHandle }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile((prev) => (prev ? { ...prev, coachVerification: data.coachVerification } : prev));
      toast.success(t("verificationSubmitted"));
    } catch {
      toast.error(t("verificationSubmitError"));
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    if (!editData.name?.trim()) {
      toast.error(t("nameRequired"));
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
      toast.success(t("profileUpdated"));
    } catch (err) {
      toast.error(t("profileUpdateError"));
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("heading")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <PencilLine className="h-4 w-4" />
                {t("editProfile")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("editProfile")}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-2">
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("nameLabel")}</label>
                  <Input
                    placeholder={t("namePlaceholder")}
                    value={editData?.name || ""}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("taglineLabel")}</label>
                  <Input
                    placeholder={t("taglinePlaceholder")}
                    value={editData?.tagline || ""}
                    onChange={(e) => handleEditChange("tagline", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("specializationLabel")}</label>
                  <Select
                    value={editData?.specialization || ""}
                    onValueChange={(v) => handleEditChange("specialization", v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("specializationPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("specializationNone")}</SelectItem>
                      <SelectItem value="fitness">{specLabels.fitness}</SelectItem>
                      <SelectItem value="yoga">{specLabels.yoga}</SelectItem>
                      <SelectItem value="pilates">{specLabels.pilates}</SelectItem>
                      <SelectItem value="beslenme">{specLabels.beslenme}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("cityLabel")}</label>
                  <Input
                    placeholder={t("cityPlaceholder")}
                    value={editData?.city || ""}
                    onChange={(e) => handleEditChange("city", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("bioLabel")}</label>
                  <Textarea
                    placeholder={t("bioPlaceholder")}
                    rows={4}
                    value={editData?.bio || ""}
                    onChange={(e) => handleEditChange("bio", e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("certificationsLabel")}</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("certificationPlaceholder")}
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCertification(); } }}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addCertification}>
                      {t("add")}
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
                  <label className="text-xs text-muted-foreground">{t("photoLabel")}</label>
                  <ProfileImageUploader onCropped={handleImageUpload} />
                  {uploading && <p className="text-xs text-muted-foreground">{t("uploading")}</p>}
                  {editData?.profilePicture ? (
                    <Image
                      src={editData.profilePicture}
                      alt={t("newPhotoAlt")}
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
                  {t("cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving || uploading}>
                  {saving ? t("saving") : t("save")}
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
                      alt={t("heading")}
                      width={96}
                      height={96}
                      className="relative rounded-2xl object-cover border border-border dark:border-zinc-800 w-[96px] h-[96px]"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl leading-none">{profile.name}</CardTitle>
                      {profile.isVerifiedCoach && (
                        <Badge variant="secondary" className="gap-1 rounded-lg">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {t("verified")}
                        </Badge>
                      )}
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
                          {specLabels[profile.specialization] || profile.specialization}
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
                      <Quote className="h-3.5 w-3.5" /> {t("aboutTitle")}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Certifications */}
                {(profile.certifications || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> {t("certificationsTitle")}
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

                {/* Verification request */}
                <div className="space-y-2 rounded-xl border border-dashed p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t("verifiedBadgeTitle")}
                  </p>
                  {profile.isVerifiedCoach ? (
                    <p className="text-sm text-muted-foreground">{t("verifiedDesc")}</p>
                  ) : profile.coachVerification?.status === "pending" ? (
                    <p className="text-sm text-muted-foreground">{t("pendingDesc")}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {profile.coachVerification?.status === "rejected"
                          ? t("rejectedDesc")
                          : t("requestDesc")}
                      </p>
                      <Input
                        placeholder={t("certUrlPlaceholder")}
                        value={certUrl}
                        onChange={(e) => setCertUrl(e.target.value)}
                      />
                      <Input
                        placeholder={t("instagramPlaceholder")}
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                      />
                      <Button size="sm" onClick={submitVerificationRequest} disabled={submittingVerification}>
                        {submittingVerification ? t("submitting") : t("submitVerification")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Empty prompts */}
                {!profile.bio && !profile.tagline && (profile.certifications || []).length === 0 && (
                  <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {t("enrichPrompt")}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-sm text-muted-foreground">{t("notFound")}</div>
            )}
          </CardContent>
        </Card>
        {/* Mobile-only quick links */}
        <div className="md:hidden mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t("otherLinksTitle")}</p>
          <div className="rounded-2xl border overflow-hidden divide-y">
            {[
              { href: "/dashboard/coach/analytics", label: t("analytics"), Icon: BarChart2 },
              { href: "/dashboard/coach/payments", label: t("payments"), Icon: CreditCard },
              { href: "/dashboard/coach/settings", label: t("settings"), Icon: Settings },
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
                {t("logout")}
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
