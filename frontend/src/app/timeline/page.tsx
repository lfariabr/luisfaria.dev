import type { Metadata } from 'next';
import { MainLayout } from '@/components/layouts/MainLayout';
import { TimelineSection } from '@/components/sections/TimelineSection';

export const metadata: Metadata = {
  title: 'Timeline — Luis Faria',
  description:
    'Career timeline of Luis Faria — from agency project management and full-stack engineering to automation platforms and data engineering at St Catherine’s School, Sydney.',
  alternates: { canonical: 'https://luisfaria.dev/timeline' },
};

export default function TimelinePage() {
  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-3xl px-6 py-14">
        <div className="mb-10 space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Timeline</h1>
          <p className="text-muted-foreground">
            The path from full-stack delivery and automation into professional data and software
            engineering.
          </p>
        </div>
        <TimelineSection showHeading={false} className="" />
      </div>
    </MainLayout>
  );
}
