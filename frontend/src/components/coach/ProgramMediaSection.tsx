"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

type Asset = {
  kind: "image" | "video";
  title?: string;
  url: string;
  storagePath: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
};

type Props = { programId: string };

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

// Small helper to stringify unknown errors without using `any`
function errMsg(err: unknown) {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || "Unknown error";
  }
  return "Unknown error";
}

export default function ProgramMediaSection({ programId }: Props) {
  const t = useTranslations("programMediaSection");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [busyPath, setBusyPath] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // load on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await axios.get<{ assets: Asset[] }>(`${API}/programs/${programId}/media`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssets(res.data.assets || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [programId]);

  // search
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
      toast.error(t("loginRequired"));
      return;
    }
    try {
      setUploading(true);
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
            if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
          },
        }
      );

      const asset = res.data.asset;
      setAssets((prev) => [asset, ...prev]);
      toast.success(t("uploaded"));

      // reset
      setFile(null);
      setTitle("");
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e));
    } finally {
      setUploading(false);
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
      toast.success(t("deleted"));
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e));
    } finally {
      setBusyPath(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder={t("titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={onSelect}
          className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-muted file:text-foreground file:text-sm rounded border border-border bg-transparent px-2 py-1.5"
        />
        <Button type="button" onClick={uploadOne} disabled={!file || uploading} className="shrink-0 gap-2">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("uploading")}</> : <><Upload className="w-4 h-4" /> {t("upload")}</>}
        </Button>
      </div>

      {progress > 0 && (
        <div className="w-full">
          <div className="h-2 rounded bg-zinc-200 dark:bg-primary/80 overflow-hidden">
            <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{progress}%</div>
        </div>
      )}

      {assets.length > 0 && (
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-zinc-200 dark:bg-primary/80 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-2">
          {assets.length === 0
            ? t("emptyNoFiles")
            : t("emptyNoMatch")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((a) => (
            <li key={a.storagePath} className="border border-border dark:border-primary/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="font-semibold truncate">{a.title || t("untitled")}</div>
                <button
                  onClick={() => deleteOne(a.storagePath)}
                  disabled={busyPath === a.storagePath}
                  className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  aria-label={t("deleteFileAria")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {a.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.title || ""} className="w-full h-auto rounded" />
              ) : (
                <video src={a.url} controls playsInline preload="metadata" className="w-full rounded" />
              )}

              <div className="text-xs text-muted-foreground mt-2">
                {a.kind.toUpperCase()} • {a.mimeType || ""} • {(a.size ?? 0) > 0 ? `${(a.size!/1024/1024).toFixed(2)} MB` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
