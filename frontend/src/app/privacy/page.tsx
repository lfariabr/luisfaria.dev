import type { Metadata } from 'next';
import { MainLayout } from '@/components/layouts/MainLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Luis Faria',
  description: 'Privacy policy for luisfaria.dev.',
  alternates: { canonical: 'https://luisfaria.dev/privacy' },
};

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="container max-w-4xl py-12 px-4 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          This website collects limited analytics and operational data to improve performance and
          maintain security.
        </p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Data Collected</h2>
          <p className="text-muted-foreground">
            Anonymous usage metrics, technical logs, and data you explicitly submit via forms.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            For privacy requests, email <a href="mailto:lfariabr@gmail.com">lfariabr@gmail.com</a>.
          </p>
        </section>
      </div>
    </MainLayout>
  );
}
