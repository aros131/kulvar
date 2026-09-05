'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard('user');
  return <>{children}</>;
}
