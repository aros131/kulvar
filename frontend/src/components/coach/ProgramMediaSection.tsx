"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

type Asset = {
  kind: "image" | "video";
  title?: string;
  url: string;
  storagePath: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
};

type Props = {
  programId: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ProgramMediaSection({ programId }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [busyPath, setBusyPath] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // messages-like: load on mount and keep local state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const run = async () => {
      try {
        // you already have GET /:id/media → getProgramMedia
        const res = await axios.get<{ assets: Asset[] }>(`${API}/programs/${programId}/media`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const list = res.data.assets || [];
        setAssets(list);
        setAllAssets(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [programId]);

  // search like in messages list
  const filtered = useMemo(() => {
    if (!search) return assets;
    const term = search.toLowerCase();
    return assets.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(term) ||
        (a.kind || "").toLowerCase().includes(term) ||
        (a.mimeType || "").toLowerCase().includes(term)
    );
  }, [assets, search]);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const uploadOne = async () => {
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not authenticated");
      return;
    }
    try {
      setProgress(0);

      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);

      const res = await axios.post<{ asset: Asset }>(
        `${API}/programs/${programId}/media`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          },
        }
      );

      const asset = res.data.asset;
      setAssets((prev) => [asset, ...prev]);
      setAllAssets((prev) => [asset, ...prev]);

      // reset
      setFile(null);
      setTitle("");
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || e?.message || "Upload failed");
    }
  };

  const deleteOne = async (storagePath: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setBusyPath(storagePath);
      await axios.delete(`${API}/programs/${programId}/media`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { storagePath },
      });
      setAssets((prev) => prev.filter((a) => a.storagePath !== storagePath));
      setAllAssets((prev) => prev.filter((a) => a.storagePath !== storagePath));
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    } finally {
      setBusyPath(null);
    }
  };

  return (
    <section className="max-w-3xl w-full mx-auto p-4">
      {/* Header like your messages page */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">📁 Program Medyası</h2>
      </div>

      {/* Search like messages */}
      <input
        type="text"
        placeholder="Ara: başlık, tür (image/video) veya MIME..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 p-2 rounded border border-zinc-300 dark:border-zinc-600"
      />

      {/* Upload row (title + file + button) */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Başlık (opsiyonel)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 p-2 rounded border border-zinc-300 dark:border-zinc-600"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={onSelect}
          className="p-2 rounded border border-zinc-300 dark:border-zinc-600"
        />
        <button
          onClick={uploadOne}
          disabled={!file}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Yükle
        </button>
      </div>

      {/* Progress (like a simple skeleton/progress) */}
      {progress > 0 && (
        <div className="w-full mb-4">
          <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-2 bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500 mt-1">{progress}%</div>
        </div>
      )}

      {/* Loading skeletons similar to messages */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center">Medya bulunamadı.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((a) => (
            <li
              key={a.storagePath}
              className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold truncate">{a.title || "(Başlıksız)"}</div>
                <button
                  onClick={() => deleteOne(a.storagePath)}
                  disabled={busyPath === a.storagePath}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Sil
                </button>
              </div>

              {a.kind === "image" ? (
                <div className="relative w-full overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.title || ""} className="w-full h-auto rounded" />
                </div>
              ) : (
                <video src={a.url} controls className="w-full rounded" />
              )}

              <div className="text-xs text-zinc-500 mt-2">
                {a.kind.toUpperCase()} • {a.mimeType || ""} • {(a.size ?? 0) > 0 ? `${(a.size!/1024/1024).toFixed(2)} MB` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
