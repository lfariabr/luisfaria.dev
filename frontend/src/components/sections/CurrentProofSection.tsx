import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CURRENT_PROOF } from '@/content/profile';

export function CurrentProofSection() {
  return (
    <section>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Current proof</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Recent proof across secure education systems, SQL/Power BI data work, applied ML,
          and agentic AI workflows documented in public.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {CURRENT_PROOF.map((item) => {
          const content = (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {item.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {item.cta && (
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  {item.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </>
          );

          if (!item.href) {
            return (
              <article
                key={item.title}
                className="group rounded-2xl border bg-card p-5 text-left transition-colors"
              >
                {content}
              </article>
            );
          }

          if (item.href.startsWith('http')) {
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20"
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
