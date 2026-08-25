"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface ProgramInfo {
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
}

export default function OdemePage() {
  const { programId } = useParams<{ programId: string }>();
  const router = useRouter();

  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const scriptInjected = useRef(false);

  // Load program info first
  useEffect(() => {
    if (!programId) return;
    fetch(`${API}/programs/${programId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const p = d.program ?? d;
        setProgram({
          name: p.name,
          description: p.description,
          priceCents: p.priceCents ?? 0,
          currency: p.currency ?? "TRY",
        });
      })
      .catch(() => setError("Program bilgisi yüklenemedi."));
  }, [programId]);

  const handleBuy = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push(`/login?next=/odeme/${programId}`); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/payment/program/${programId}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ödeme başlatılamadı");
      setCheckoutHtml(data.checkoutFormContent);
    } catch (err: any) {
      setError(err.message ?? "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Inject iyzico checkout form HTML + run its script
  useEffect(() => {
    if (!checkoutHtml || !formContainerRef.current || scriptInjected.current) return;
    scriptInjected.current = true;
    formContainerRef.current.innerHTML = checkoutHtml;
    // Execute any <script> tags iyzico injects
    formContainerRef.current.querySelectorAll("script").forEach((oldScript) => {
      const s = document.createElement("script");
      if (oldScript.src) s.src = oldScript.src;
      else s.textContent = oldScript.textContent;
      s.async = false;
      document.body.appendChild(s);
    });
  }, [checkoutHtml]);

  const priceFormatted = program?.priceCents
    ? Intl.NumberFormat("tr-TR", { style: "currency", currency: program.currency, maximumFractionDigits: 0 }).format(program.priceCents / 100)
    : null;

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Geri Dön
        </button>

        <div className="bg-background border rounded-2xl shadow-sm p-6 space-y-6">
          {/* Program summary */}
          {program && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Program</p>
              <h1 className="text-xl font-bold">{program.name}</h1>
              {program.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{program.description}</p>
              )}
              {priceFormatted && (
                <p className="text-2xl font-bold text-primary pt-1">{priceFormatted}</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* iyzico form renders here */}
          {checkoutHtml ? (
            <div ref={formContainerRef} className="min-h-[200px]" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-green-500" />
                <span>Ödeme işleminiz iyzico altyapısıyla 256-bit SSL şifrelemesi ile korunmaktadır. Kart bilgileriniz sitemizde saklanmaz.</span>
              </div>

              <Button
                onClick={handleBuy}
                disabled={loading || !program}
                className="w-full h-11 text-base"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {loading ? "Yükleniyor..." : `Güvenli Öde${priceFormatted ? ` — ${priceFormatted}` : ""}`}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Satın alma ile{" "}
          <a href="/terms" className="underline hover:text-foreground">kullanım koşullarını</a>{" "}
          kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
