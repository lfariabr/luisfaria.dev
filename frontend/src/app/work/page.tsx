import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { CASE_STUDIES } from '@/content/caseStudies';
import { sanitizeJsonLd } from '@/lib/seo/metadata';

export default function WorkPage() {
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Case Studies | Luis Faria',
    url: 'https://luisfaria.dev/work',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: CASE_STUDIES.map((cs, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://luisfaria.dev/work/${cs.slug}`,
        name: cs.title,
      })),
    },
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(itemListLd) }}
      />
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="mb-10 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Case studies</h1>
          <p className="text-muted-foreground">
            Selected work, told as problem → approach → stack → outcome.
          </p>
        </div>

        <div className="space-y-5">
          {CASE_STUDIES.map((cs) => (
            <Link
              key={cs.slug}
              href={`/work/${cs.slug}`}
              className="group block rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{cs.context}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{cs.period}</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold group-hover:text-foreground">{cs.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{cs.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {cs.pillars.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  Read case study
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Looking for everything? Browse all{' '}
          <Link href="/projects" className="underline underline-offset-2 hover:text-foreground">
            projects
          </Link>{' '}
          and{' '}
          <Link href="/articles" className="underline underline-offset-2 hover:text-foreground">
            writing
          </Link>
          .
        </p>
      </div>
    </MainLayout>
  );
}
