'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface NotifPrefs {
  inApp: { bookingRequests: boolean; bookingUpdates: boolean; messages: boolean; reviews: boolean };
  email: { bookingRequests: boolean; bookingUpdates: boolean; messages: boolean; weeklyReport: boolean };
}

const defaultPrefs = (): NotifPrefs => ({
  inApp:  { bookingRequests: true, bookingUpdates: true, messages: true, reviews: true },
  email:  { bookingRequests: true, bookingUpdates: true, messages: false, weeklyReport: false },
});

export default function CoachSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs());
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email || '');
        if (d.price != null) setPrice(String(d.price));
        if (d.notificationPreferences) {
          setPrefs({
            inApp:  { ...defaultPrefs().inApp,  ...d.notificationPreferences.inApp  },
            email:  { ...defaultPrefs().email,  ...d.notificationPreferences.email  },
          });
        }
      })
      .catch(() => {});
  }, []);

  const savePrice = async () => {
    const parsed = Number(price);
    if (price !== '' && (isNaN(parsed) || parsed < 0)) { toast.error('Geçerli bir fiyat girin.'); return; }
    setSavingPrice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: price === '' ? null : parsed }),
      });
      if (!res.ok) throw new Error();
      toast.success('Fiyat güncellendi.');
    } catch {
      toast.error('Kaydedilemedi.');
    } finally {
      setSavingPrice(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Yeni şifreler eşleşmiyor.'); return; }
    if (newPassword.length < 6) { toast.error('Şifre en az 6 karakter olmalı.'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Şifre başarıyla güncellendi.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/auth/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { localStorage.clear(); window.location.href = '/'; }
    else toast.error('Hesap silinemedi.');
  };

  const toggleInApp = (key: keyof NotifPrefs['inApp']) => {
    setPrefs(p => ({ ...p, inApp: { ...p.inApp, [key]: !p.inApp[key] } }));
  };

  const toggleEmail = (key: keyof NotifPrefs['email']) => {
    setPrefs(p => ({ ...p, email: { ...p.email, [key]: !p.email[key] } }));
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile/notification-preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      toast.success('Bildirim tercihleri kaydedildi.');
    } catch {
      toast.error('Kaydedilemedi.');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <CoachPageShell>
    <div className="max-w-xl mx-auto px-4 py-8 md:py-10 space-y-10">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-3">
        <h2 className="text-lg font-semibold">Hesap Bilgileri</h2>
        <div>
          <Label>E-posta</Label>
          <Input value={email} disabled className="mt-1 bg-zinc-100 dark:bg-primary/80" />
          <p className="text-xs text-muted-foreground mt-1">E-posta değişikliği için destek ekibiyle iletişime geçin.</p>
        </div>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-4">
        <h2 className="text-lg font-semibold">Saat Başı Ücret</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₺</span>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="örn. 500"
              className="mt-1 pl-7"
            />
          </div>
          <Button onClick={savePrice} disabled={savingPrice} className="mt-1">
            {savingPrice ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Bu fiyat profilinizde ve koç listesinde görünecektir.</p>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Şifre Değiştir</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label>Mevcut Şifre</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label>Yeni Şifre</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label>Yeni Şifre (Tekrar)</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
          </Button>
        </form>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-6">
        <h2 className="text-lg font-semibold">Bildirim Tercihleri</h2>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Uygulama İçi</h3>
          {([
            ['bookingRequests', 'Yeni randevu istekleri'],
            ['bookingUpdates',  'Randevu durumu değişiklikleri'],
            ['messages',        'Mesajlar'],
            ['reviews',         'Yeni yorumlar'],
          ] as [keyof NotifPrefs['inApp'], string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="font-normal">{label}</Label>
              <Switch checked={prefs.inApp[key]} onCheckedChange={() => toggleInApp(key)} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">E-posta</h3>
          {([
            ['bookingRequests', 'Yeni randevu istekleri'],
            ['bookingUpdates',  'Randevu durumu değişiklikleri'],
            ['messages',        'Mesajlar'],
            ['weeklyReport',    'Haftalık rapor özeti'],
          ] as [keyof NotifPrefs['email'], string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="font-normal">{label}</Label>
              <Switch checked={prefs.email[key]} onCheckedChange={() => toggleEmail(key)} />
            </div>
          ))}
        </div>

        <Button onClick={savePrefs} disabled={savingPrefs} className="w-full">
          {savingPrefs ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
        </Button>
      </section>

      <section className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Tehlikeli Alan</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">Hesabınızı silerseniz tüm verileriniz kalıcı olarak silinir.</p>
        <Button variant="destructive" onClick={handleDeleteAccount}>Hesabı Sil</Button>
      </section>
    </div>
    </CoachPageShell>
  );
}
