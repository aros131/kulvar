'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UserPageShell from '@/components/user/UserPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Invoice {
  _id: string;
  coachId?: { name: string };
  amount: number;
  description: string;
  status: 'Pending' | 'Paid' | 'Failed';
  createdAt: string;
}

/** Browsers don't execute <script> tags inserted via innerHTML, so iyzico's
 *  checkoutFormContent (which injects its iframe via an inline <script>) needs
 *  its scripts re-created and appended manually to actually run. */
function CheckoutFormRenderer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = html;

    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.text = oldScript.textContent || '';
      oldScript.replaceWith(newScript);
    });

    return () => {
      container.innerHTML = '';
    };
  }, [html]);

  return <div ref={containerRef} className="min-h-[480px]" />;
}

function UserPaymentsInner() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState<string | null>(null);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = () => localStorage.getItem('token') || '';

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API}/payment/my-invoices`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch {
      toast.error('Faturalar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const [resultBanner, setResultBanner] = useState<{ status: "success" | "failed"; programId?: string } | null>(null);

  useEffect(() => {
    const status = searchParams?.get('status');
    if (!status) return;
    const programId = searchParams?.get('programId') || undefined;
    if (status === 'success') {
      setResultBanner({ status: 'success', programId });
      fetchInvoices();
    } else if (status === 'failed') {
      setResultBanner({ status: 'failed' });
    }
    router.replace('/dashboard/user/payments');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const startPayment = async (invoiceId: string) => {
    setInitializing(invoiceId);
    try {
      const res = await fetch(`${API}/payment/iyzico/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'init failed');
      setCheckoutHtml(data.checkoutFormContent);
    } catch {
      toast.error('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
    } finally {
      setInitializing(null);
    }
  };

  if (loading) return <UserPageShell><div className="p-8 text-sm text-muted-foreground">Yükleniyor...</div></UserPageShell>;

  return (
    <UserPageShell>
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <h1 className="text-2xl font-bold">Ödemelerim</h1>

        {resultBanner?.status === 'success' && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Ödeme başarılı!</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                Programınıza erişiminiz aktif edildi.{' '}
                {resultBanner.programId && (
                  <a href="/dashboard/user/programs" className="underline font-medium">Programlarıma Git →</a>
                )}
              </p>
            </div>
          </div>
        )}

        {resultBanner?.status === 'failed' && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="font-semibold text-red-700 dark:text-red-400">Ödeme başarısız oldu.</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.</p>
          </div>
        )}

        {invoices.length === 0 ? (
          <div className="bg-card dark:bg-primary/90 rounded-2xl p-8 shadow text-center text-muted-foreground">
            Henüz size ait fatura yok.
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                className="bg-card dark:bg-primary/90 border rounded-xl p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{inv.description}</p>
                  {inv.coachId?.name && (
                    <p className="text-sm text-muted-foreground">Koç: {inv.coachId.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-bold text-lg">₺{inv.amount}</p>
                  {inv.status === 'Paid' ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Ödendi
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={initializing === inv._id}
                      onClick={() => startPayment(inv._id)}
                    >
                      {initializing === inv._id ? 'Hazırlanıyor...' : 'Öde'}
                    </Button>
                  )}
                  {inv.status === 'Failed' && (
                    <span className="text-xs text-red-500">Son ödeme denemesi başarısız oldu</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!checkoutHtml} onOpenChange={(open) => !open && setCheckoutHtml(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ödeme</DialogTitle>
          </DialogHeader>
          {checkoutHtml && <CheckoutFormRenderer html={checkoutHtml} />}
        </DialogContent>
      </Dialog>
    </UserPageShell>
  );
}

export default function UserPaymentsPage() {
  return (
    <Suspense>
      <UserPaymentsInner />
    </Suspense>
  );
}
