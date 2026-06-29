import type { Metadata } from 'next';
import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { POSITIONING } from "@/content/profile";
import { PillarsSection } from "@/components/sections/PillarsSection";
import { StackSection } from "@/components/sections/StackSection";
import { MetricsSection } from "@/components/sections/MetricsSection";
import { TimelineSection } from "@/components/sections/TimelineSection";
import { sanitizeJsonLd } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  alternates: { canonical: 'https://luisfaria.dev' },
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Luis Faria',
  jobTitle: 'Software & Data Engineer',
  url: 'https://luisfaria.dev',
  sameAs: [
    'https://github.com/lfariabr',
    'https://linkedin.com/in/luisfariabr',
    'https://x.com/luisfariabr',
  ],
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Luis Faria',
  url: 'https://luisfaria.dev',
  description:
    'Portfolio of Luis Faria — software and data engineer who solves real business problems with software, data, automation, and AI.',
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Luis Faria',
  url: 'https://luisfaria.dev',
  logo: 'https://luisfaria.dev/og-default.png',
  sameAs: [
    'https://github.com/lfariabr',
    'https://linkedin.com/in/luisfariabr',
    'https://x.com/luisfariabr',
  ],
};

export default function Home() {
  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organizationLd) }}
      />
      <div className="flex flex-col items-center bg-gradient-to-b from-background to-slate-50 dark:from-background dark:to-slate-950">
        <div className="container max-w-4xl px-6 py-16 space-y-16">
          {/* Hero */}
          <div className="space-y-8 sm:space-y-10 text-center">
            {/* Badge */}
            <p className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1 text-xs font-medium text-muted-foreground">
              {POSITIONING.badge}
            </p>

            {/* Heading + subheading */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight sm:text-5xl lg:text-6xl">
                I solve real business problems
                <span className="block bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  with software and data.
                </span>
              </h1>

              <p className="mx-auto max-w-[720px] text-base text-muted-foreground sm:text-lg">
                {POSITIONING.subline}
              </p>
            </div>

            {/* Proof strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
              {POSITIONING.proof.map((item, i) => (
                <span key={item} className="flex items-center gap-3">
                  {i > 0 ? <span className="text-muted-foreground/40">·</span> : null}
                  {item}
                </span>
              ))}
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/work">See my work</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/about">About me</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-full px-6">
                <Link href="/chatbot">Try my AI assistant</Link>
              </Button>
            </div>
          </div>

          {/* What I do — pillars */}
          <PillarsSection />

          {/* Core stack grouped by pillar */}
          <StackSection />

          <MetricsSection />
          <TimelineSection limit={4} showViewAll />
        </div>
      </div>
    </MainLayout>
  );
}
