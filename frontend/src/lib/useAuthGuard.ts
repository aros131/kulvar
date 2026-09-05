'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard(requiredRole?: 'coach' | 'user') {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    if (requiredRole) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== requiredRole) {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }
  }, [router, requiredRole]);
}
