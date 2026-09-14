'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="bg-zinc-100 dark:bg-primary/90 py-10 px-6 mt-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <h4 className="font-semibold mb-2">{t('about')}</h4>
          <p>{t('copyright')}</p>
        </div>

        <div className="space-y-2">
          <Link href="/privacy">{t('privacy')}</Link><br />
          <Link href="/terms">{t('terms')}</Link><br />
          <Link href="/contact">{t('contact')}</Link><br />
          <Link href="/admin_login">{t('adminLogin')}</Link>
        </div>

        <div>
          <h4 className="font-semibold mb-2">{t('followUs')}</h4>
          <div className="flex gap-4">
            <Link href="https://facebook.com">
              <Image src="/images/facebook.svg" alt="Facebook" width={24} height={24} />
            </Link>
            <Link href="https://twitter.com">
              <Image src="/images/twitter.svg" alt="Twitter" width={24} height={24} />
            </Link>
            <Link href="https://instagram.com">
              <Image src="/images/instagram.svg" alt="Instagram" width={24} height={24} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
