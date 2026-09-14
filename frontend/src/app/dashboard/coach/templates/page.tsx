'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CoachPageShell from '@/components/coach/CoachPageShell';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

interface Template {
  _id: string;
  name: string;
  description: string;
  fitnessGoal: string;
  difficulty: string;
  duration: number;
}

export default function CoachTemplatesPage() {
  const t = useTranslations('templatesCoach');
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/programs/templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data.templates) ? data.templates : []))
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUse = async (template: Template) => {
    setUsingId(template._id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/programs/templates/${template._id}/use`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(t('convertedSuccess'));
      router.push(`/dashboard/coach/programs/${data.program._id}/edit`);
    } catch {
      toast.error(t('convertError'));
    } finally {
      setUsingId(null);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!window.confirm(t('deleteConfirm', { name: template.name }))) return;
    setDeletingId(template._id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/programs/${template._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setTemplates((prev) => prev.filter((tpl) => tpl._id !== template._id));
      toast.success(t('deleted'));
    } catch {
      toast.error(t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <CoachPageShell><div className="p-8 text-sm text-muted-foreground">{t('loading')}</div></CoachPageShell>;

  return (
    <CoachPageShell>
      <div className="px-4 py-8 md:py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{t('heading')}</h1>
          <Link href="/dashboard/coach/programs/create?mode=template">
            <Button>{t('newTemplate')}</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('intro')}
        </p>

        {templates.length === 0 && (
          <p className="text-muted-foreground">
            {t('emptyPrefix')}{' '}
            <Link href="/dashboard/coach/programs" className="underline">{t('emptyLink')}</Link>{' '}
            {t('emptySuffix')}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template._id} className="bg-card dark:bg-primary/90 border rounded-xl p-5 shadow-sm space-y-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-lg">{template.name}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="bg-zinc-100 dark:bg-primary/80 px-2 py-1 rounded">{template.difficulty}</span>
                <span className="bg-zinc-100 dark:bg-primary/80 px-2 py-1 rounded">{template.fitnessGoal}</span>
                <span className="bg-zinc-100 dark:bg-primary/80 px-2 py-1 rounded">{t('weeksUnit', { value: template.duration })}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => handleUse(template)} disabled={usingId === template._id}>
                  {usingId === template._id ? t('converting') : t('convertToProgram')}
                </Button>
                <Link href={`/dashboard/coach/programs/${template._id}/edit`}>
                  <Button variant="outline" size="sm">{t('edit')}</Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(template)}
                  disabled={deletingId === template._id}
                >
                  {deletingId === template._id ? t('deleting') : t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CoachPageShell>
  );
}
