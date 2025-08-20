"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import ProfileImageUploader from "@/components/ProfileImageUploader";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

/* ---------- Types ---------- */
export type Coach = {
  _id: string;
  name: string;
  email?: string;
  role?: "coach" | "user" | string;
  profilePicture?: string;
  specialization?: string | string[];
  city?: string;
  rating?: number;
  bio?: string;
  programsCount?: number;
};

type ViewerProfile = {
  _id: string;
  name: string;
  email: string;
  role: "coach" | "user";
  profilePicture?: string;
  specialization?: string | string[];
};

/* ---------- Utils ---------- */
const toArray = (x?: string | string[]) => (!x ? [] : Array.isArray(x) ? x : [x]);
const capFirst = (s: string) =>
  s ? s.charAt(0).toLocaleUpperCase("tr") + s.slice(1).toLocaleLowerCase("tr") : s;
const initials = (name?: string) => {
  if (!name) return "KÇ";
  const parts = name.trim().split(/\s+/);
  const two = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (two || parts[0]?.[0] || "KÇ").toUpperCase();
};

/* ---------- Component ---------- */
export default function CoachProfileClient({ coach }: { coach: Coach }) {
  // what we render (start with server-fetched coach)
  const [viewCoach, setViewCoach] = useState<Coach>(coach);

  // viewer (logged-in user) and edit permissions
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // edit dialog state
  const [editData, setEditData] = useState<Coach | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // keep local view in sync if URL changes to another coach
  useEffect(() => {
    setViewCoach(coach);
  }, [coach]);

  // fetch /profile to detect ownership (safe, guard all optional reads)
  useEffect(() => {
    if (!viewCoach) {
      setCanEdit(false);
      setViewer(null);
      setEditData(null);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setCanEdit(false);
      setViewer(null);
      setEditData(null);
      return;
    }

    (async () => {
      try {
        const res = await axios.get<ViewerProfile>(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vp = res.data;
        setViewer(vp);

        const owns =
          (!!vp?._id && !!viewCoach?._id && vp._id === viewCoach._id) ||
          (!!vp?.email && !!viewCoach?.email && vp.email === viewCoach.email);

        const editable = Boolean(owns && vp.role === "coach");
        setCanEdit(editable);

        if (editable) {
          setEditData({
            ...viewCoach,
            role: "coach",
            email: viewCoach.email || vp.email,
            profilePicture: viewCoach.profilePicture || vp.profilePicture || "",
          });
        } else {
          setEditData(null);
        }
      } catch {
        setCanEdit(false);
        setViewer(null);
        setEditData(null);
      }
    })();
  }, [viewCoach]);

  const specs = useMemo(() => toArray(viewCoach?.specialization), [viewCoach?.specialization]);

  const handleEditChange = (field: keyof Coach, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
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

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token yok");

      const res = await axios.put(`${API}/profile`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = (res.data as Coach) || editData;

      // reflect changes on screen
      setViewCoach((prev) => ({
        ...prev,
        name: updated.name ?? prev.name,
        profilePicture: updated.profilePicture ?? prev.profilePicture,
        specialization: updated.specialization ?? prev.specialization,
        bio: updated.bio ?? prev.bio,
        city: updated.city ?? prev.city,
      }));

      setDialogOpen(false);
      toast.success("Profil başarıyla güncellendi.");
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
          src={viewCoach?.profilePicture || "/images/default-user.jpg"}
          alt="Profil Fotoğrafı"
          width={120}
          height={120}
          className="rounded-full border shadow object-cover w-[120px] h-[120px]"
          unoptimized
        />

        <div className="text-center space-y-2">
          <p className="text-lg">
            <strong>İsim:</strong> {viewCoach?.name}
          </p>

          {viewCoach?.email && (
            <p className="text-gray-700">
              <strong>Email:</strong> {viewCoach.email}
            </p>
          )}

          {viewCoach?.city && (
            <p className="text-gray-700">
              <strong>Şehir:</strong> {viewCoach.city}
            </p>
          )}

          {typeof viewCoach?.rating === "number" && (
            <p className="text-gray-700">
              <strong>Puan:</strong> {viewCoach.rating.toFixed(1)}
            </p>
          )}

          <p className="text-gray-700">
            <strong>Branş:</strong>{" "}
            {specs.length
              ? specs.map((s, i) => (
                  <span key={`${s}-${i}`}>{i ? ", " : ""}{capFirst(s)}</span>
                ))
              : "Belirtilmemiş"}
          </p>
        </div>

        {viewCoach?.bio && (
          <div className="w-full mt-2">
            <h3 className="text-sm font-medium">Hakkında</h3>
            <p className="text-gray-600 mt-1">{viewCoach.bio}</p>
          </div>
        )}

        {typeof viewCoach?.programsCount === "number" && (
          <div className="w-full">
            <p className="text-gray-700">
              <strong>Program:</strong> {viewCoach.programsCount}
            </p>
          </div>
        )}

        {/* Owner-only edit */}
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
                  value={
                    typeof editData?.specialization === "string"
                      ? editData?.specialization ?? ""
                      : toArray(editData?.specialization).join(", ")
                  }
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
