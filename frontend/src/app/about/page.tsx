import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, Linkedin, Mail, PenLine, MapPin } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { PillarsSection } from '@/components/sections/PillarsSection';
import { StackSection } from '@/components/sections/StackSection';
import { ABOUT_BIO, SOCIALS, POSITIONING } from '@/content/profile';
import { sanitizeJsonLd } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'About — Luis Faria',
  description:
    'Luis Faria — software and data engineer in Sydney. 10+ years turning manual workflows into automated, KPI-driven systems across software, data, automation, and AI.',
  alternates: { canonical: 'https://luisfaria.dev/about' },
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Luis Faria',
  jobTitle: 'Software & Data Engineer',
  url: 'https://luisfaria.dev/about',
  address: { '@type': 'PostalAddress', addressLocality: 'Sydney', addressCountry: 'AU' },
  sameAs: [SOCIALS.github, SOCIALS.linkedin, SOCIALS.devto],
};

export default function AboutPage() {
  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(personLd) }}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-16 space-y-14">
        {/* Intro */}
        <header className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1 text-xs font-medium text-muted-foreground">
            {POSITIONING.badge}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">About</h1>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {ABOUT_BIO.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {SOCIALS.location}
          </p>
        </header>

        {/* Currently */}
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Currently
          </h2>
          <p className="text-sm leading-relaxed">
            Building data systems at <strong>St Catherine’s School, Sydney</strong> — SQL Server
            pipelines and Power BI reporting — while completing a{' '}
            <strong>Master of Software Engineering with AI</strong>. I keep the coursework applied:
            secure cloud architectures on AWS, a self-hosted Apache Superset BI deployment, and AI
            tooling built on OpenAI.
          </p>
        </section>

        {/* Pillars */}
        <PillarsSection heading="What I do" />

        {/* Stack */}
        <StackSection heading="Tools I work with" />

        {/* Links */}
        <section className="space-y-4 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Let’s connect
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <a href={SOCIALS.github} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" /> GitHub
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={SOCIALS.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={SOCIALS.devto} target="_blank" rel="noopener noreferrer">
                <PenLine className="mr-2 h-4 w-4" /> dev.to
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={`mailto:${SOCIALS.email}`}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
            </Button>
          </div>
          <div>
            <Button asChild className="mt-2 rounded-full px-6">
              <Link href="/work">See my work</Link>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
