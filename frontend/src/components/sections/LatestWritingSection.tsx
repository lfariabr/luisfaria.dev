import { ArrowRight } from 'lucide-react';
import { LATEST_WRITING, SOCIALS } from '@/content/profile';

const dateFormat = new Intl.DateTimeFormat('en-AU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "Latest writing": the three newest dev.to articles (#491). */
export function LatestWritingSection() {
  return (
    <section aria-labelledby="latest-writing-heading">
      <h2
        id="latest-writing-heading"
        className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Latest writing
      </h2>
      <ul className="divide-y rounded-2xl border bg-card">
        {LATEST_WRITING.map((article) => (
          <li key={article.href}>
            <a
              href={article.href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1 px-5 py-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <time
                dateTime={article.date}
                className="flex-none text-xs tabular-nums text-muted-foreground sm:w-24"
              >
                {dateFormat.format(new Date(article.date))}
              </time>
              <span className="text-sm font-medium">{article.title}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <a
          href={SOCIALS.devto}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          All writing on dev.to
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}
