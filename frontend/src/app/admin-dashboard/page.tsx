'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Dumbbell, BarChart2, Search, Trash2, LogOut, Star, Check, X, Wallet, BadgeCheck, Instagram, FileText } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'coach' | 'admin';
  createdAt?: string;
}

interface AdminReview {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
  coachId?: { name?: string; email?: string };
}

interface CoachApplication {
  _id: string;
  name: string;
  email: string;
  city?: string;
  specialization?: string[];
  isApproved: boolean;
  createdAt?: string;
}

interface VerificationRequest {
  _id: string;
  name: string;
  email: string;
  city?: string;
  coachVerification: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    certificateUrl?: string;
    instagram?: string;
    requestedAt?: string;
  };
}

interface AdminPayment {
  _id: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Failed';
  platformFeeCents?: number;
  coachNetCents?: number;
  createdAt: string;
  coachId?: { name?: string; email?: string };
  userId?: { name?: string; email?: string };
}

const LOCALE_TAG: Record<string, string> = { tr: 'tr-TR', en: 'en-US', fr: 'fr-FR' };

export default function AdminDashboardPage() {
  const t = useTranslations('adminDashboard');
  const locale = useLocale();
  const dateTag = LOCALE_TAG[locale] || 'tr-TR';
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'users' | 'coaches' | 'reviews' | 'applications' | 'verification' | 'payments'>('users');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!token() || role !== 'admin') {
      router.replace('/admin_login');
      return;
    }

    Promise.all([
      fetch(`${API}/auth/users?role=user`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch(`${API}/auth/users?role=coach`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch(`${API}/programs`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ])
      .then(([usersData, coachesData, programsData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setCoaches(Array.isArray(coachesData) ? coachesData : []);
        setTotalPrograms(
          Array.isArray(programsData?.programs) ? programsData.programs.length :
          Array.isArray(programsData) ? programsData.length : 0
        );
      })
      .catch(() => toast.error(t('loadDataError')))
      .finally(() => setLoading(false));

    fetch(`${API}/admin/reviews?limit=50`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d.reviews) ? d.reviews : []))
      .catch(() => toast.error(t('loadReviewsError')))
      .finally(() => setLoadingReviews(false));

    fetch(`${API}/admin/coaches?limit=100`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setApplications(Array.isArray(d.coaches) ? d.coaches : []))
      .catch(() => toast.error(t('loadApplicationsError')))
      .finally(() => setLoadingApplications(false));

    fetch(`${API}/admin/payments?limit=50`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setPayments(Array.isArray(d.payments) ? d.payments : []))
      .catch(() => toast.error(t('loadPaymentsError')))
      .finally(() => setLoadingPayments(false));

    fetch(`${API}/admin/verification-requests?limit=100`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setVerificationRequests(Array.isArray(d.coaches) ? d.coaches : []))
      .catch(() => toast.error(t('loadVerificationError')))
      .finally(() => setLoadingVerification(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleVerificationReview = async (coachId: string, approve: boolean) => {
    setReviewing(coachId);
    try {
      const res = await fetch(`${API}/admin/verification-requests/${coachId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      if (!res.ok) throw new Error();
      setVerificationRequests(p => p.filter(c => c._id !== coachId));
      toast.success(approve ? t('coachVerified') : t('requestRejected'));
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setReviewing(null);
    }
  };

  const handleApproval = async (coachId: string, approved: boolean) => {
    setApproving(coachId);
    try {
      const res = await fetch(`${API}/admin/coaches/${coachId}/approval`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error();
      setApplications(p => p.map(c => (c._id === coachId ? { ...c, isApproved: approved } : c)));
      toast.success(approved ? t('coachApproved') : t('coachApprovalRemoved'));
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t('confirmDeleteUser'))) return;
    setDeleting(userId);
    try {
      const res = await fetch(`${API}/auth/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'X-Target-User': userId },
      });
      if (!res.ok) throw new Error();
      setUsers(p => p.filter(u => u._id !== userId));
      setCoaches(p => p.filter(u => u._id !== userId));
      toast.success(t('userDeleted'));
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t('confirmDeleteReview'))) return;
    setDeleting(reviewId);
    try {
      const res = await fetch(`${API}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setReviews(p => p.filter(r => r._id !== reviewId));
      toast.success(t('reviewDeleted'));
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.replace('/admin_login');
  };

  const list = tab === 'users' ? users : tab === 'coaches' ? coaches : [];
  const filtered = list.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('heading')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="py-6">
                  <Skeleton className="h-4 w-28 mb-3" />
                  <Skeleton className="h-10 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { label: t('statUsers'), value: users.length, Icon: Users, color: 'text-blue-500' },
              { label: t('statCoaches'), value: coaches.length, Icon: Dumbbell, color: 'text-emerald-500' },
              { label: t('statPrograms'), value: totalPrograms, Icon: BarChart2, color: 'text-purple-500' },
            ].map(({ label, value, Icon, color }) => (
              <Card key={label} className="rounded-2xl">
                <CardContent className="py-6 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl bg-zinc-100 dark:bg-primary/90 grid place-items-center shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* User / Coach / Review Table */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={tab === 'users' ? 'default' : 'outline'}
                  onClick={() => setTab('users')}
                >
                  {t('tabUsers')} ({users.length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'coaches' ? 'default' : 'outline'}
                  onClick={() => setTab('coaches')}
                >
                  {t('tabCoaches')} ({coaches.length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'reviews' ? 'default' : 'outline'}
                  onClick={() => setTab('reviews')}
                >
                  {t('tabReviews')} ({reviews.length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'applications' ? 'default' : 'outline'}
                  onClick={() => setTab('applications')}
                >
                  {t('tabApplications')} ({applications.filter(c => !c.isApproved).length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'verification' ? 'default' : 'outline'}
                  onClick={() => setTab('verification')}
                >
                  {t('tabVerification')} ({verificationRequests.length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'payments' ? 'default' : 'outline'}
                  onClick={() => setTab('payments')}
                >
                  {t('tabPayments')} ({payments.length})
                </Button>
              </div>
              {tab !== 'reviews' && tab !== 'applications' && tab !== 'verification' && tab !== 'payments' && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tab === 'applications' ? (
              loadingApplications ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('noApplications')}</p>
              ) : (
                <ul className="divide-y">
                  {applications.map(c => (
                    <li key={c._id} className="flex items-center gap-3 py-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-primary/80 grid place-items-center text-xs font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}{c.city ? ` · ${c.city}` : ''}</p>
                      </div>
                      <Badge variant={c.isApproved ? 'default' : 'secondary'} className="shrink-0">
                        {c.isApproved ? t('approved') : t('pending')}
                      </Badge>
                      {c.isApproved ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                          disabled={approving === c._id}
                          onClick={() => handleApproval(c._id, false)}
                          title={t('removeApproval')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 shrink-0"
                          disabled={approving === c._id}
                          onClick={() => handleApproval(c._id, true)}
                          title={t('approve')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )
            ) : tab === 'verification' ? (
              loadingVerification ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : verificationRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('noVerificationRequests')}</p>
              ) : (
                <ul className="divide-y">
                  {verificationRequests.map(c => (
                    <li key={c._id} className="flex items-start gap-3 py-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-primary/80 grid place-items-center text-xs font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}{c.city ? ` · ${c.city}` : ''}</p>
                        <div className="flex flex-col gap-1 mt-1.5">
                          {c.coachVerification.certificateUrl && (
                            <a href={c.coachVerification.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <FileText className="h-3 w-3" /> {t('certificateLink')}
                            </a>
                          )}
                          {c.coachVerification.instagram && (
                            <a href={`https://instagram.com/${c.coachVerification.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
                              <Instagram className="h-3 w-3" /> @{c.coachVerification.instagram.replace(/^@/, '')}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          disabled={reviewing === c._id}
                          onClick={() => handleVerificationReview(c._id, false)}
                          title={t('reject')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          disabled={reviewing === c._id}
                          onClick={() => handleVerificationReview(c._id, true)}
                          title={t('verify')}
                        >
                          <BadgeCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : tab === 'payments' ? (
              loadingPayments ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('noPaymentsYet')}</p>
              ) : (
                <ul className="divide-y">
                  {payments.map(p => (
                    <li key={p._id} className="flex items-start gap-3 py-3">
                      <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-primary/90 grid place-items-center shrink-0 text-emerald-500">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{p.userId?.name || t('userFallback')}</span>
                          <span className="text-xs text-muted-foreground">→ {p.coachId?.name || t('coachFallback')}</span>
                          <Badge variant={p.status === 'Paid' ? 'default' : p.status === 'Failed' ? 'destructive' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ₺{p.amount.toFixed(2)}
                          {typeof p.platformFeeCents === 'number' && (
                            <span className="text-xs"> · {t('commissionNet', { fee: (p.platformFeeCents / 100).toFixed(2), net: ((p.coachNetCents ?? 0) / 100).toFixed(2) })}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(p.createdAt).toLocaleDateString(dateTag)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : tab === 'reviews' ? (
              loadingReviews ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('noReviewsYet')}</p>
              ) : (
                <ul className="divide-y">
                  {reviews.map(r => (
                    <li key={r._id} className="flex items-start gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.userId?.name || t('userFallback')}</span>
                          <span className="text-xs text-muted-foreground">→ {r.coachId?.name || t('coachFallback')}</span>
                          <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {r.rating}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.comment || '—'}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(r.createdAt).toLocaleDateString(dateTag)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                        disabled={deleting === r._id}
                        onClick={() => handleDeleteReview(r._id)}
                        title={t('deleteReview')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )
            ) : loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t('noResults')}</p>
            ) : (
              <ul className="divide-y">
                {filtered.map(u => (
                  <li key={u._id} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-primary/80 grid place-items-center text-xs font-bold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge variant={u.role === 'coach' ? 'default' : 'secondary'} className="shrink-0">
                      {u.role}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                      disabled={deleting === u._id}
                      onClick={() => handleDelete(u._id)}
                      title={t('deleteUser')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          {t.rich('adminSetupHint', { code: () => <code className="bg-zinc-100 dark:bg-primary/90 px-1 rounded">role: &quot;admin&quot;</code> })}
        </p>
      </div>
    </div>
  );
}
