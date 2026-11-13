import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BUILDING_NOW } from '@/content/profile';

const linkClass =
  'group mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground';

/** "What I'm building now": three first-person cards (#490). */
export function BuildingNowSection() {
  return (
    <section aria-labelledby="building-now-heading">
      <h2 id="building-now-heading" className="mb-6 text-center text-2xl font-bold tracking-tight">
        What I’m building now
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {BUILDING_NOW.map((item) => {
          const cta = (
            <>
              {item.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          );

          return (
            <article
              key={item.title}
              className="flex flex-col rounded-2xl border bg-card p-5 text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {item.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
              {item.credit && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {item.credit.lead}{' '}
                  <a
                    href={item.credit.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {item.credit.label}
                  </a>
                  .
                </p>
              )}
              <div className="mt-auto">
                {item.href.startsWith('http') ? (
                  <a href={item.href} target="_blank" rel="noreferrer" className={linkClass}>
                    {cta}
                  </a>
                ) : (
                  <Link href={item.href} className={linkClass}>
                    {cta}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
