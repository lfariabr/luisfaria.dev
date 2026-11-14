import type { Metadata } from 'next';
import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HERO_METRICS } from "@/content/profile";
import { HeroHeadline } from "@/components/sections/HeroHeadline";
import { BuildingNowSection } from "@/components/sections/BuildingNowSection";
import { HowIShipSection } from "@/components/sections/HowIShipSection";
import { WorkWithSection } from "@/components/sections/WorkWithSection";
import { LatestWritingSection } from "@/components/sections/LatestWritingSection";
import { OffTheClockSection } from "@/components/sections/OffTheClockSection";
import { TimelineSection } from "@/components/sections/TimelineSection";
import { sanitizeJsonLd } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  alternates: { canonical: 'https://luisfaria.dev' },
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Luis Faria',
  jobTitle: 'Senior Software Engineer',
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
    'Portfolio of Luis Faria, a senior software engineer in Sydney: a parent portal used by 2,000 families, school data systems, and applied ML.',
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
              {HERO_METRICS.map((metric) => {
                const content = (
                  <>
                    <dt
                      className={cn(
                        "text-lg font-bold sm:text-xl",
                        metric.accent && "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {metric.value}
                    </dt>
                    <dd className="mt-1 text-xs text-muted-foreground">
                      {metric.label}
                      {metric.href && " ↗"}
                    </dd>
                  </>
                );

                return metric.href ? (
                  <a
                    key={metric.value}
                    href={metric.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-xl border border-border bg-muted/40 px-4 py-3 text-center transition-colors hover:border-emerald-400"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={metric.value}
                    className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center"
                  >
                    {content}
                  </div>
                );
              })}
            </dl>

            {/* Primary CTAs. The AI assistant button is hidden while the chatbot is off (#497). */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/work">See my work</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/about">About me</Link>
              </Button>
            </div>
          </div>

          <BuildingNowSection />

          <HowIShipSection />

          <WorkWithSection />

          <LatestWritingSection />

          <OffTheClockSection />

          <TimelineSection limit={4} showViewAll />
        </div>
      </div>
    </MainLayout>
  );
}
