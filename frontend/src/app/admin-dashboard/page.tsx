'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Dumbbell, BarChart2, Search, Trash2, LogOut, Star } from 'lucide-react';

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'users' | 'coaches' | 'reviews'>('users');
  const [deleting, setDeleting] = useState<string | null>(null);

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
      .catch(() => toast.error('Veriler yüklenemedi.'))
      .finally(() => setLoading(false));

    fetch(`${API}/admin/reviews?limit=50`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d.reviews) ? d.reviews : []))
      .catch(() => toast.error('Yorumlar yüklenemedi.'))
      .finally(() => setLoadingReviews(false));
  }, [router]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    setDeleting(userId);
    try {
      const res = await fetch(`${API}/auth/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}`, 'X-Target-User': userId },
      });
      if (!res.ok) throw new Error();
      setUsers(p => p.filter(u => u._id !== userId));
      setCoaches(p => p.filter(u => u._id !== userId));
      toast.success('Kullanıcı silindi.');
    } catch {
      toast.error('Silme işlemi başarısız.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    setDeleting(reviewId);
    try {
      const res = await fetch(`${API}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setReviews(p => p.filter(r => r._id !== reviewId));
      toast.success('Yorum silindi.');
    } catch {
      toast.error('Silme işlemi başarısız.');
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
            <p className="text-sm text-muted-foreground mt-1">PerSe Coaching yönetim merkezi</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Çıkış
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
              { label: 'Kullanıcılar', value: users.length, Icon: Users, color: 'text-blue-500' },
              { label: 'Koçlar', value: coaches.length, Icon: Dumbbell, color: 'text-emerald-500' },
              { label: 'Programlar', value: totalPrograms, Icon: BarChart2, color: 'text-purple-500' },
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
                  Kullanıcılar ({users.length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'coaches' ? 'default' : 'outline'}
                  onClick={() => setTab('coaches')}
                >
                  Koçlar ({coaches.length})
                </Button>
                <Button
                  size="sm"
                  variant={tab === 'reviews' ? 'default' : 'outline'}
                  onClick={() => setTab('reviews')}
                >
                  Yorumlar ({reviews.length})
                </Button>
              </div>
              {tab !== 'reviews' && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="İsim veya e-posta ara..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tab === 'reviews' ? (
              loadingReviews ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Henüz yorum yok.</p>
              ) : (
                <ul className="divide-y">
                  {reviews.map(r => (
                    <li key={r._id} className="flex items-start gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.userId?.name || 'Kullanıcı'}</span>
                          <span className="text-xs text-muted-foreground">→ {r.coachId?.name || 'Koç'}</span>
                          <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {r.rating}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.comment || '—'}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                        disabled={deleting === r._id}
                        onClick={() => handleDeleteReview(r._id)}
                        title="Yorumu Sil"
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
              <p className="text-sm text-muted-foreground py-6 text-center">Sonuç bulunamadı.</p>
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
                      title="Kullanıcıyı Sil"
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
          Admin kullanıcısı oluşturmak için MongoDB&apos;ye{' '}
          <code className="bg-zinc-100 dark:bg-primary/90 px-1 rounded">role: &quot;admin&quot;</code> ile kayıt ekleyin.
        </p>
      </div>
    </div>
  );
}
