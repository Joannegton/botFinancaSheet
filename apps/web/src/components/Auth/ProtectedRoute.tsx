'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!usuario && !pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [usuario, pathname, router]);

  if (!usuario && !pathname.startsWith('/auth')) {
    return null;
  }

  return children;
}
