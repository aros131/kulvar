'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function TermsOfServicePage() {
  const t = useTranslations('terms');
  const section2List = t.raw('section2List') as string[];
  const section4List = t.raw('section4List') as string[];

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="max-w-3xl mx-auto prose prose-zinc dark:prose-invert">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground dark:text-white">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <div className="space-y-8 text-zinc-700 dark:text-zinc-300">

          <Section title={t('section1Title')}>
            <p>{t('section1P1')}</p>
            <p className="mt-2">{t('section1P2')}</p>
          </Section>

          <Section title={t('section2Title')}>
            <p>{t('section2Intro')}</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {section2List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          <Section title={t('section3Title')}>
            <p>{t('section3P1')}</p>
            <p className="mt-2">{t('section3P2')}</p>
            <p className="mt-2">{t('section3P3')}</p>
          </Section>

          <Section title={t('section4Title')}>
            <p>{t('section4Intro')}</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {section4List.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          <Section title={t('section5Title')}>
            <p>{t('section5P1')}</p>
          </Section>

          <Section title={t('section6Title')}>
            <p>{t('section6P1')}</p>
            <p className="mt-2">{t('section6P2')}</p>
          </Section>

          <Section title={t('section7Title')}>
            <p>{t('section7P1')}</p>
          </Section>

          <Section title={t('section8Title')}>
            <p>{t('section8P1')}</p>
          </Section>

          <Section title={t('section9Title')}>
            <p>
              {t('section9Pre')}{' '}
              <Link href="/contact" className="text-indigo-600 hover:underline">
                {t('contactLinkLabel')}
              </Link>{' '}
              {t('section9Post')}
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-border dark:border-primary/50">
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            {t('backToHome')}
          </Link>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">{title}</h2>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
