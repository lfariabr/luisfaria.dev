'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { SessionRetry } from '@/components/auth/SessionRetry';
import { RelationshipMap } from '@/components/relationship/RelationshipMap';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCanViewRelationshipPins } from '@/lib/auth/isAdmin';

export default function RelationshipPageClient() {
  const { status, refetchUser } = useAuth();
  const canViewRelationshipPins = useCanViewRelationshipPins();
  const router = useRouter();
  const pathname = usePathname() ?? '/relationship';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && !canViewRelationshipPins) {
      router.push('/');
    }
  }, [status, canViewRelationshipPins, pathname, router]);

  if (status === 'error') {
    return <SessionRetry onRetry={refetchUser} />;
  }

  if (status !== 'authenticated' || !canViewRelationshipPins) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <RelationshipMap />
      </div>
    </MainLayout>
  );
}
