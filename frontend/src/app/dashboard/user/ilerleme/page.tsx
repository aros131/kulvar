"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface Photo {
  _id: string;
  url: string;
  date: string;
  note?: string;
  weight?: number | null;
}

function formatDateTR(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function IlerlemePhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [note, setNote] = useState("");
  const [weight, setWeight] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  useEffect(() => {
    fetchPhotos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/progress-photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch {
      toast.error("Fotoğraflar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const cancelPending = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setNote("");
    setWeight("");
  };

  const uploadPhoto = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", pendingFile);
      if (note.trim()) form.append("note", note.trim());
      if (weight) form.append("weight", weight);

      const res = await fetch(`${API}/progress-photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPhotos((prev) => [data.photo, ...prev]);
      cancelPending();
      toast.success("Fotoğraf eklendi.");
    } catch {
      toast.error("Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm("Bu fotoğrafı silmek istiyor musun?")) return;
    try {
      const res = await fetch(`${API}/progress-photos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPhotos((prev) => prev.filter((p) => p._id !== id));
      if (lightbox?._id === id) setLightbox(null);
      toast.success("Silindi.");
    } catch {
      toast.error("Silinemedi.");
    }
  };

  return (
    <UserPageShell>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">İlerleme Fotoğrafları</h1>
          <Button onClick={() => fileRef.current?.click()} className="gap-2" disabled={uploading}>
            <Camera className="w-4 h-4" />
            Fotoğraf Ekle
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Upload preview panel */}
        {pendingFile && previewUrl && (
          <div className="rounded-2xl border bg-card p-4 space-y-4">
            <div className="relative w-full max-h-64 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Önizleme" className="w-full object-cover max-h-64" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Not (isteğe bağlı)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="örn. 4. hafta sonu"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Kilo (kg, isteğe bağlı)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="örn. 78.5"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={uploadPhoto} disabled={uploading} className="flex-1">
                {uploading ? "Yükleniyor..." : "Kaydet"}
              </Button>
              <Button variant="outline" onClick={cancelPending} disabled={uploading}>
                İptal
              </Button>
            </div>
          </div>
        )}

        {/* Photo grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">📸</p>
            <p className="font-semibold text-lg">Henüz fotoğraf yok</p>
            <p className="text-sm text-muted-foreground">İlerleni takip etmek için düzenli fotoğraf ekle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer bg-muted"
                onClick={() => setLightbox(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.note || "İlerleme fotoğrafı"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <button
                    className="self-end p-1.5 bg-red-500 rounded-lg text-white"
                    onClick={e => { e.stopPropagation(); deletePhoto(photo._id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="space-y-0.5">
                    <p className="text-white text-xs font-medium">{formatDateTR(photo.date)}</p>
                    {photo.weight && (
                      <p className="text-white/80 text-xs">{photo.weight} kg</p>
                    )}
                    {photo.note && (
                      <p className="text-white/80 text-xs truncate">{photo.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-lg w-full bg-card rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/50 rounded-lg text-white"
              onClick={() => setLightbox(null)}
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt="" className="w-full max-h-[70vh] object-contain" />
            <div className="p-4 space-y-1">
              <p className="font-semibold">{formatDateTR(lightbox.date)}</p>
              {lightbox.weight && (
                <p className="text-sm text-muted-foreground">{lightbox.weight} kg</p>
              )}
              {lightbox.note && (
                <p className="text-sm text-muted-foreground">{lightbox.note}</p>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => deletePhoto(lightbox._id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </UserPageShell>
  );
}
