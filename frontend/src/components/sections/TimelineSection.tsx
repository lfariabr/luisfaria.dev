import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TIMELINE } from '@/content/timeline';

interface TimelineSectionProps {
  /** Show only the most recent N entries (used on the home page). */
  limit?: number;
  /** Render the section's own "Timeline at a glance" heading. */
  showHeading?: boolean;
  /** Render a "View full timeline" link to /timeline. */
  showViewAll?: boolean;
  className?: string;
}

export function TimelineSection({
  limit,
  showHeading = true,
  showViewAll = false,
  className = 'mx-auto max-w-4xl px-4 py-16',
}: TimelineSectionProps) {
  const entries = limit ? TIMELINE.slice(-limit) : TIMELINE;

  return (
    <section className={className}>
      <div className="space-y-6">
        {showHeading ? (
          <>
            <h2 className="text-2xl text-center font-bold tracking-tight">Timeline at a glance</h2>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-2xl mx-auto">
              Key career milestones and technical achievements
            </p>
          </>
        ) : null}

        <ol className="space-y-6 border-l-2 border-border pl-6 text-sm" aria-label="Career timeline">
          {entries.map((entry) => (
            <li key={entry.period}>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {entry.period}
              </span>
              <p className="mt-1">{entry.body}</p>
              {entry.links && entry.links.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs font-semibold underline underline-offset-4 hover:text-emerald-500"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>

        {showViewAll ? (
          <div className="pl-6">
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              View full timeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
