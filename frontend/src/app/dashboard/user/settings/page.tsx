'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import UserPageShell from '@/components/user/UserPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface NotifPrefs {
  inApp:  { bookingRequests: boolean; bookingUpdates: boolean; messages: boolean; reviews: boolean };
  email:  { bookingRequests: boolean; bookingUpdates: boolean; messages: boolean; weeklyReport: boolean };
}

const defaultPrefs = (): NotifPrefs => ({
  inApp:  { bookingRequests: true, bookingUpdates: true, messages: true, reviews: true },
  email:  { bookingRequests: true, bookingUpdates: true, messages: false, weeklyReport: false },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 space-y-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function UserSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email,           setEmail]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [prefs,           setPrefs]           = useState<NotifPrefs>(defaultPrefs());
  const [savingPrefs,     setSavingPrefs]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email || '');
        if (d.notificationPreferences) {
          setPrefs({
            inApp:  { ...defaultPrefs().inApp,  ...d.notificationPreferences.inApp  },
            email:  { ...defaultPrefs().email,  ...d.notificationPreferences.email  },
          });
        }
      })
      .catch(() => {});
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Yeni şifreler eşleşmiyor.'); return; }
    if (newPassword.length < 6)          { toast.error('Şifre en az 6 karakter olmalı.'); return; }
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
    <UserPageShell>
      <div className="max-w-xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Hesap ve bildirim tercihlerini yönet.</p>
        </div>

        {/* Hesap */}
        <Section title="Hesap Bilgileri">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">E-posta</Label>
            <Input value={email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">E-posta değişikliği için destek ekibiyle iletişime geçin.</p>
          </div>
        </Section>

        {/* Şifre */}
        <Section title="Şifre Değiştir">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mevcut Şifre</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Yeni Şifre</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
            </Button>
          </form>
        </Section>

        {/* Bildirim tercihleri */}
        <Section title="Bildirim Tercihleri">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uygulama İçi</p>
              {([
                ['bookingRequests', 'Randevu onayları ve ret bildirimleri'],
                ['bookingUpdates',  'Randevu durumu değişiklikleri'],
                ['messages',        'Mesajlar'],
                ['reviews',         'Değerlendirme bildirimleri'],
              ] as [keyof NotifPrefs['inApp'], string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="font-normal text-sm">{label}</Label>
                  <Switch
                    checked={prefs.inApp[key]}
                    onCheckedChange={() => setPrefs(p => ({ ...p, inApp: { ...p.inApp, [key]: !p.inApp[key] } }))}
                  />
                </div>
              ))}
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">E-posta</p>
              {([
                ['bookingRequests', 'Randevu onayları ve ret bildirimleri'],
                ['bookingUpdates',  'Randevu durumu değişiklikleri'],
                ['messages',        'Mesajlar'],
                ['weeklyReport',    'Haftalık özet'],
              ] as [keyof NotifPrefs['email'], string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="font-normal text-sm">{label}</Label>
                  <Switch
                    checked={prefs.email[key]}
                    onCheckedChange={() => setPrefs(p => ({ ...p, email: { ...p.email, [key]: !p.email[key] } }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={savePrefs} disabled={savingPrefs} className="w-full mt-2">
            {savingPrefs ? 'Kaydediliyor…' : 'Tercihleri Kaydet'}
          </Button>
        </Section>

        {/* Tehlikeli Alan */}
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <h2 className="text-base font-semibold text-destructive">Tehlikeli Alan</h2>
          <p className="text-sm text-muted-foreground">Hesabınızı silerseniz tüm verileriniz kalıcı olarak silinir.</p>
          <Button variant="destructive" onClick={handleDeleteAccount}>Hesabı Sil</Button>
        </section>
      </div>
    </UserPageShell>
  );
}
