"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Dumbbell } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

type Coach = {
  _id: string;
  name: string;
  email?: string;
  role: "coach" | string;
  profilePicture: string;
  specialization?: string | string[];
  city?: string;
  rating?: number;
  bio?: string;
  programsCount?: number;
};

type ProfileResponse = {
  _id: string;
  name: string;
  email: string;
  role: "coach" | "user";
  profilePicture: string;
  specialization?: string | string[];
  // ...other fields
};

function toArray(x?: string | string[]) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}
function capFirst(s: string) {
  return s ? s.charAt(0).toLocaleUpperCase("tr") + s.slice(1).toLocaleLowerCase("tr") : s;
}
function initials(name?: string) {
  if (!name) return "KÇ";
  const parts = name.trim().split(/\s+/);
  const two = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (two || parts[0]?.[0] || "KÇ").toUpperCase();
}

export default function CoachProfileClient({ coach }: { coach: Coach }) {
  const [viewer, setViewer] = useState<ProfileResponse | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  // local edit state (starts from "viewer" profile if owner, else from coach)
  const [editData, setEditData] = useState<Coach | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // who is viewing? try /profile using token
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setCanEdit(false);
      setViewer(null);
      setEditData(null);
      return;
    }
    (async () => {
      try {
        const res = await axios.get<ProfileResponse>(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setViewer(res.data);
        const owns = !!res.data && (res.data._id === coach._id || res.data.email === coach.email);
        setCanEdit(owns && res.data.role === "coach");
        // if owner, allow editing on their own profile payload (often more complete)
        setEditData(owns ? ({
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: "coach",
          profilePicture: res.data.profilePicture,
          specialization: res.data.specialization,
          city: coach.city,
          rating: coach.rating,
          bio: coach.bio,
          programsCount: coach.programsCount,
        } as Coach) : null);
      } catch {
        setCanEdit(false);
        setViewer(null);
        setEditData(null);
      }
    })();
  }, [coach._id, coach.email, coach.city, coach.rating, coach.bio, coach.programsCount]);

  const specs = useMemo(() => toArray(coach.specialization), [coach.specialization]);

  const handleEditChange = (field: keyof Coach, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value } as Coach);
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !editData) return;
    if (!editData.email) {
      toast.error("E-posta gerekli (oturum açmış olmalısınız).");
      return;
    }
    setUploading(true);
    try {
      const emailSafe = editData.email.replace(/[@.]/g, "_");
      const fileRef = ref(storage, `profile-pictures/${emailSafe}/${uuidv4()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setEditData(prev => prev ? { ...prev, profilePicture: downloadURL } as Coach : prev);
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

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token yok");

      // save to /profile (owner only)
      const res = await axios.put(`${API}/profile`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // reflect changes in page
      toast.success("Profil başarıyla güncellendi.");
      setDialogOpen(false);
      // merge visible info from response if available
      const updated = res.data || editData;
      // update the static view fields we show from `coach`
      (coach as any).name = updated.name ?? coach.name;
      (coach as any).profilePicture = updated.profilePicture ?? coach.profilePicture;
      (coach as any).specialization = updated.specialization ?? coach.specialization;
      (coach as any).bio = updated.bio ?? coach.bio;
    } catch (err) {
      toast.error("Profil güncellenemedi.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Koç Profili</h2>

      <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center gap-4">
        <Image
          src={coach.profilePicture || "/images/default-user.jpg"}
          alt="Profil Fotoğrafı"
          width={120}
          height={120}
          className="rounded-full border shadow object-cover w-[120px] h-[120px]"
          unoptimized
        />

        <div className="text-center space-y-2">
          <p className="text-lg">
            <strong>İsim:</strong> {coach.name}
          </p>
          {coach.city && (
            <p className="text-gray-700">
              <strong>Şehir:</strong> {coach.city}
            </p>
          )}
          {typeof coach.rating === "number" && (
            <p className="text-gray-700">
              <strong>Puan:</strong> {coach.rating.toFixed(1)}
            </p>
          )}
          <p className="text-gray-700">
            <strong>Branş:</strong>{" "}
            {specs.length ? specs.map((s, i) => <span key={s}>{i ? ", " : ""}{capFirst(s)}</span>) : "Belirtilmemiş"}
          </p>
        </div>

        {/* Read-only badges / about */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specs.map((s) => (
              <Badge key={s} variant="secondary" className="capitalize">
                <Dumbbell className="h-3.5 w-3.5 mr-1" />
                {capFirst(s)}
              </Badge>
            ))}
          </div>
        )}

        {coach.bio && (
          <div className="w-full mt-2">
            <h3 className="text-sm font-medium">Hakkında</h3>
            <p className="text-muted-foreground mt-1">{coach.bio}</p>
          </div>
        )}

        {/* Owner-only edit dialog */}
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Profili Düzenle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Profili Düzenle</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                <Input
                  placeholder="İsim"
                  value={editData?.name || ""}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                />
                <Input
                  placeholder="Branş (örn: yoga)"
                  value={typeof editData?.specialization === "string" ? (editData?.specialization ?? "") : toArray(editData?.specialization).join(", ")}
                  onChange={(e) => handleEditChange("specialization", e.target.value)}
                />

                <ProfileImageUploader onCropped={handleImageUpload} />

                {uploading && <p className="text-sm text-gray-500">Yükleniyor...</p>}

                {editData?.profilePicture && (
                  <Image
                    src={editData.profilePicture}
                    alt="Yeni Profil"
                    width={100}
                    height={100}
                    className="rounded-full object-cover w-[100px] h-[100px]"
                    unoptimized
                  />
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button onClick={handleSave} disabled={uploading}>
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
