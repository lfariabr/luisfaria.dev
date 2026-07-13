import { Code2, Database, Workflow, Sparkles, type LucideIcon } from 'lucide-react';
import { PILLARS, type Pillar } from '@/content/profile';

const ICONS: Record<Pillar['icon'], LucideIcon> = {
  Code2,
  Database,
  Workflow,
  Sparkles,
};

interface PillarsSectionProps {
  heading?: string;
  className?: string;
}

/** "What I do" - the four pillars (Software · Data · Automation · AI/ML). */
export function PillarsSection({ heading = 'What I do', className }: PillarsSectionProps) {
  return (
    <section className={className}>
      {heading ? (
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {PILLARS.map((pillar) => {
          const Icon = ICONS[pillar.icon];
          return (
            <div
              key={pillar.key}
              className="rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">{pillar.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{pillar.blurb}</p>
              <div className="flex flex-wrap gap-1.5">
                {pillar.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
