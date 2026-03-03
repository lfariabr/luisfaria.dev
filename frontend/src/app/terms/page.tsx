import type { Metadata } from 'next';
import { MainLayout } from '@/components/layouts/MainLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | Luis Faria',
  description: 'Terms of service for luisfaria.dev.',
  alternates: { canonical: 'https://luisfaria.dev/terms' },
};

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="container max-w-4xl py-12 px-4 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">
          By using this website, you agree to use content and tools responsibly and lawfully.
        </p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Content Use</h2>
          <p className="text-muted-foreground">
            Content is provided for informational purposes. Reuse requires attribution where
            applicable.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Disclaimer</h2>
          <p className="text-muted-foreground">
            Services and information are provided as-is without guarantees of uninterrupted
            availability.
          </p>
        </section>
      </div>
    </MainLayout>
  );
}
