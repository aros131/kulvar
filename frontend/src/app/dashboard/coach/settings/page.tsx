'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('settingsCoach');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs());
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [savingListed, setSavingListed] = useState(false);
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email || '');
        if (d.price != null) setPrice(String(d.price));
        setIsListed(!!d.isListedCoach);
        if (d.brandColor) setBrandColor(d.brandColor);
        if (d.brandLogoUrl) setBrandLogoUrl(d.brandLogoUrl);
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
    if (price !== '' && (isNaN(parsed) || parsed < 0)) { toast.error(t('invalidPrice')); return; }
    setSavingPrice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: price === '' ? null : parsed }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('priceUpdated'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSavingPrice(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error(t('passwordMismatch')); return; }
    if (newPassword.length < 6) { toast.error(t('passwordTooShort')); return; }
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
      toast.success(t('passwordUpdated'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/auth/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { localStorage.clear(); document.cookie = "token=; path=/; max-age=0; SameSite=Lax"; window.location.href = '/'; }
    else toast.error(t('deleteError'));
  };

  const saveListed = async (val: boolean) => {
    setIsListed(val);
    setSavingListed(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isListedCoach: val }),
      });
      if (!res.ok) throw new Error();
      toast.success(val ? t('listedOn') : t('listedOff'));
    } catch {
      setIsListed(!val);
      toast.error(t('saveError'));
    } finally {
      setSavingListed(false);
    }
  };

  const saveBrand = async () => {
    setSavingBrand(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ brandColor, brandLogoUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('brandSaved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSavingBrand(false);
    }
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
      toast.success(t('prefsSaved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <CoachPageShell>
    <div className="max-w-xl mx-auto px-4 py-8 md:py-10 space-y-10">
      <h1 className="text-2xl font-bold">{t('heading')}</h1>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-3">
        <h2 className="text-lg font-semibold">{t('accountInfo')}</h2>
        <div>
          <Label>{t('emailLabel')}</Label>
          <Input value={email} disabled className="mt-1 bg-zinc-100 dark:bg-primary/80" />
          <p className="text-xs text-muted-foreground mt-1">{t('emailChangeHint')}</p>
        </div>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-4">
        <h2 className="text-lg font-semibold">{t('hourlyRate')}</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₺</span>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t('pricePlaceholder')}
              className="mt-1 pl-7"
            />
          </div>
          <Button onClick={savePrice} disabled={savingPrice} className="mt-1">
            {savingPrice ? t('saving') : t('save')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('priceHint')}</p>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-1">{t('coachListTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('coachListDesc')}</p>
        <div className="flex items-center justify-between">
          <Label className="font-normal">{t('showInList')}</Label>
          <Switch checked={isListed} onCheckedChange={saveListed} disabled={savingListed} />
        </div>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-4">
        <h2 className="text-lg font-semibold">{t('brandSettings')}</h2>
        <p className="text-sm text-muted-foreground -mt-2">{t('brandSettingsDesc')}</p>

        <div>
          <Label>{t('brandColor')}</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="color"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <input
              type="text"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              placeholder="#6366f1"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            />
            <div
              className="w-10 h-10 rounded-lg border border-border shrink-0"
              style={{ background: brandColor }}
            />
          </div>
        </div>

        <div>
          <Label>{t('logoUrl')}</Label>
          <Input
            value={brandLogoUrl}
            onChange={e => setBrandLogoUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1"
          />
          {brandLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogoUrl} alt={t('logoPreviewAlt')} className="mt-2 h-12 object-contain rounded" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
        </div>

        <Button onClick={saveBrand} disabled={savingBrand}>
          {savingBrand ? t('saving') : t('save')}
        </Button>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">{t('changePassword')}</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label>{t('currentPassword')}</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label>{t('newPassword')}</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label>{t('confirmNewPassword')}</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? t('saving') : t('updatePassword')}
          </Button>
        </form>
      </section>

      <section className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow space-y-6">
        <h2 className="text-lg font-semibold">{t('notifPrefs')}</h2>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">{t('inApp')}</h3>
          {([
            ['bookingRequests', t('newBookingRequests')],
            ['bookingUpdates',  t('bookingUpdates')],
            ['messages',        t('messages')],
            ['reviews',         t('newReviews')],
          ] as [keyof NotifPrefs['inApp'], string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="font-normal">{label}</Label>
              <Switch checked={prefs.inApp[key]} onCheckedChange={() => toggleInApp(key)} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">{t('email')}</h3>
          {([
            ['bookingRequests', t('newBookingRequests')],
            ['bookingUpdates',  t('bookingUpdates')],
            ['messages',        t('messages')],
            ['weeklyReport',    t('weeklyReportSummary')],
          ] as [keyof NotifPrefs['email'], string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="font-normal">{label}</Label>
              <Switch checked={prefs.email[key]} onCheckedChange={() => toggleEmail(key)} />
            </div>
          ))}
        </div>

        <Button onClick={savePrefs} disabled={savingPrefs} className="w-full">
          {savingPrefs ? t('saving') : t('savePrefs')}
        </Button>
      </section>

      <section className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">{t('dangerZone')}</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">{t('dangerZoneDesc')}</p>
        <Button variant="destructive" onClick={handleDeleteAccount}>{t('deleteAccount')}</Button>
      </section>
    </div>
    </CoachPageShell>
  );
}
