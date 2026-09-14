'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

interface Invoice {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  amount: number;
  description: string;
  status: 'Pending' | 'Paid';
  createdAt: string;
  platformFeeCents?: number | null;
  coachNetCents?: number | null;
  programId?: string | null;
  engagementId?: { _id: string; billingType: 'monthly' | 'weekly' | 'per_session' } | string | null;
}

function invoiceSourceLabel(inv: Invoice, t: ReturnType<typeof useTranslations>): string {
  if (inv.programId) return t('sourceProgramSale');
  if (inv.engagementId && typeof inv.engagementId === 'object') {
    const billingKey: Record<string, string> = {
      monthly: 'billingMonthly',
      weekly: 'billingWeekly',
      per_session: 'billingPerSession',
    };
    const key = billingKey[inv.engagementId.billingType];
    return key ? t(key) : t('sourceEngagement');
  }
  if (inv.engagementId) return t('sourceEngagement');
  return t('sourceManualInvoice');
}

interface Client {
  _id: string;
  name: string;
  email: string;
}

export default function CoachPaymentsPage() {
  const t = useTranslations('paymentsCoach');
  const locale = useLocale();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const token = () => localStorage.getItem('token') || '';

  const fetchInvoices = () =>
    fetch(`${API}/payment/invoices`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setInvoices(Array.isArray(d.invoices) ? d.invoices : []))
      .catch(() => toast.error(t('loadError')));

  useEffect(() => {
    Promise.all([
      fetchInvoices(),
      fetch(`${API}/programs/clients`, { headers: { Authorization: `Bearer ${token()}` } })
        .then((r) => r.json())
        .then((d) => setClients(Array.isArray(d) ? d : [])),
    ]).finally(() => setLoading(false));
  }, []);

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.amount || !form.description) {
      toast.error(t('fillAllFields'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/payment/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ userId: form.userId, amount: Number(form.amount), description: form.description }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('invoiceCreated'));
      setForm({ userId: '', amount: '', description: '' });
      setShowForm(false);
      fetchInvoices();
    } catch {
      toast.error(t('invoiceCreateError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CoachPageShell><div className="p-8 text-sm text-muted-foreground">{t('loading')}</div></CoachPageShell>;

  return (
    <CoachPageShell>
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('heading')}</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? t('cancel') : t('createInvoice')}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={createInvoice} className="bg-card dark:bg-primary/90 rounded-2xl p-6 shadow space-y-4">
          <h2 className="font-semibold">{t('newInvoice')}</h2>
          <div>
            <Label>{t('clientLabel')}</Label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full mt-1 p-2 border rounded-md bg-card dark:bg-primary/80 dark:text-white"
              required
            >
              <option value="">{t('clientPlaceholder')}</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name} — {c.email}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t('amountLabel')}</Label>
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>{t('descriptionLabel')}</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('creating') : t('createInvoiceBtn')}
          </Button>
        </form>
      )}

      {(() => {
        const now = new Date();
        const weeks = Array.from({ length: 8 }, (_, i) => {
          const end = new Date(now);
          end.setDate(end.getDate() - i * 7);
          const start = new Date(end);
          start.setDate(start.getDate() - 6);
          return { start, end, label: t('weekShort', { n: 7 - i }) };
        }).reverse();
        const weeklyRevenue = weeks.map(({ start, end }) =>
          invoices
            .filter((inv) => inv.status === 'Paid')
            .filter((inv) => {
              const d = new Date(inv.createdAt);
              return d >= start && d <= end;
            })
            .reduce((s, inv) => s + inv.amount, 0)
        );
        const maxRev = Math.max(...weeklyRevenue, 1);
        return (
          <div className="bg-card dark:bg-primary/90 border rounded-2xl p-6 space-y-3">
            <h2 className="font-semibold text-sm">{t('weeklyRevenue')}</h2>
            <div className="flex items-end gap-2 h-32">
              {weeklyRevenue.map((rev, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{rev > 0 ? `₺${rev}` : ''}</span>
                  <div
                    className="w-full rounded-t-md bg-indigo-500 dark:bg-indigo-400 transition-all"
                    style={{ height: `${Math.max((rev / maxRev) * 96, rev > 0 ? 4 : 0)}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{weeks[i].label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {invoices.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const clientName = typeof inv.userId === 'object' ? inv.userId.name : inv.userId;
            return (
              <div key={inv._id} className="bg-card dark:bg-primary/90 border rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{inv.description}</p>
                  <p className="text-sm text-muted-foreground">{clientName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{invoiceSourceLabel(inv, t)}</span>
                    <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString(LOCALE_TAG[locale] || 'tr-TR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₺{inv.amount}</p>
                  {typeof inv.coachNetCents === 'number' && (
                    <p className="text-xs text-muted-foreground">
                      {t('netAmount', { net: (inv.coachNetCents / 100).toFixed(2), fee: ((inv.platformFeeCents ?? 0) / 100).toFixed(2) })}
                    </p>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inv.status === 'Paid' ? t('paid') : t('pending')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </CoachPageShell>
  );
}
