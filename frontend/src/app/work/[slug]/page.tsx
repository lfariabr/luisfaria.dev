import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { CASE_STUDIES, getCaseStudy } from '@/content/caseStudies';
import { sanitizeJsonLd } from '@/lib/seo/metadata';

const SITE_URL = 'https://luisfaria.dev';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CASE_STUDIES.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) return { title: 'Case Study Not Found' };

  return {
    title: `${cs.title} | Case Study | Luis Faria`,
    description: cs.tagline,
    alternates: { canonical: `${SITE_URL}/work/${cs.slug}` },
    openGraph: {
      title: cs.title,
      description: cs.tagline,
      url: `${SITE_URL}/work/${cs.slug}`,
      siteName: 'Luis Faria',
      type: 'article',
    },
  };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) notFound();

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cs.title,
    description: cs.tagline,
    url: `${SITE_URL}/work/${cs.slug}`,
    author: { '@type': 'Person', name: 'Luis Faria' },
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(articleLd) }}
      />
      <article className="mx-auto w-full max-w-3xl px-6 py-12 space-y-10">
        <div className="space-y-4">
          <Link
            href="/work"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All case studies
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{cs.context}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{cs.period}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{cs.title}</h1>
          <p className="text-lg text-muted-foreground">{cs.tagline}</p>
          <div className="flex flex-wrap gap-2">
            {cs.pillars.map((p) => (
              <span key={p} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </div>

        <Block title="Problem">
          <p className="leading-relaxed text-muted-foreground">{cs.problem}</p>
        </Block>

        <Block title="Approach">
          <ul className="space-y-2">
            {cs.approach.map((step, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Stack">
          <div className="flex flex-wrap gap-2 text-xs">
            {cs.stack.map((s) => (
              <span key={s} className="rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </Block>

        <Block title="Outcome">
          <ul className="space-y-2">
            {cs.outcomes.map((o, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span className="leading-relaxed">{o}</span>
              </li>
            ))}
          </ul>
        </Block>

        {cs.links && cs.links.length > 0 ? (
          <div className="flex flex-wrap gap-3 border-t pt-6">
            {cs.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        ) : null}
      </article>
    </MainLayout>
  );
}
