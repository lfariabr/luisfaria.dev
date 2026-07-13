import type { Metadata } from 'next';
import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HERO_METRICS } from "@/content/profile";
import { HeroHeadline } from "@/components/sections/HeroHeadline";
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
    'Portfolio of Luis Faria - software and data engineer who solves real business problems with software, data, automation, and AI.',
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
            <HeroHeadline />

            {/* Metrics row */}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HERO_METRICS.map((metric) => (
                <div
                  key={metric.value}
                  className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center"
                >
                  <dt
                    className={cn(
                      "text-lg font-bold sm:text-xl",
                      metric.accent && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {metric.value}
                  </dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{metric.label}</dd>
                </div>
              ))}
            </dl>

            {/* Primary CTAs - AI assistant gets visual priority (emerald ring + tint). */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/work">See my work</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/about">About me</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-full px-6 ring-2 ring-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
              >
                <Link href="/chatbot">Try my AI assistant</Link>
              </Button>
            </div>
          </div>

          {/* What I do - pillars */}
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
