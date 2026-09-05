'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard('coach');
  return <>{children}</>;
}
