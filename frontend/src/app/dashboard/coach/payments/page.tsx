'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Invoice {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  amount: number;
  description: string;
  status: 'Pending' | 'Paid';
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
}

export default function CoachPaymentsPage() {
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
      .catch(() => toast.error('Faturalar yüklenemedi.'));

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
      toast.error('Tüm alanları doldurun.');
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
      toast.success('Fatura oluşturuldu.');
      setForm({ userId: '', amount: '', description: '' });
      setShowForm(false);
      fetchInvoices();
    } catch {
      toast.error('Fatura oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CoachPageShell><div className="p-8 text-sm text-muted-foreground">Yükleniyor...</div></CoachPageShell>;

  return (
    <CoachPageShell>
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ödemeler</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'İptal' : '+ Fatura Oluştur'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={createInvoice} className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow space-y-4">
          <h2 className="font-semibold">Yeni Fatura</h2>
          <div>
            <Label>Danışan</Label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-zinc-700 dark:text-white"
              required
            >
              <option value="">Danışan seçin</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name} — {c.email}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tutar (₺)</Label>
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
            <Label>Açıklama</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Oluşturuluyor...' : 'Fatura Oluştur'}
          </Button>
        </form>
      )}

      {invoices.length === 0 ? (
        <p className="text-zinc-400">Henüz fatura yok.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const clientName = typeof inv.userId === 'object' ? inv.userId.name : inv.userId;
            return (
              <div key={inv._id} className="bg-white dark:bg-zinc-800 border rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{inv.description}</p>
                  <p className="text-sm text-zinc-500">{clientName}</p>
                  <p className="text-xs text-zinc-400">{new Date(inv.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₺{inv.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inv.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
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
