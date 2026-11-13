import { WORK_AREAS } from '@/content/profile';

interface WorkWithSectionProps {
  heading?: string;
  className?: string;
}

/** "What I work with": four areas, each with its tools, listed once (#490 merged Pillars + Stack). */
export function WorkWithSection({ heading = 'What I work with', className }: WorkWithSectionProps) {
  return (
    <section className={className}>
      <h2 className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {WORK_AREAS.map((area) => (
          <div key={area.label} className="rounded-2xl border bg-card p-5 text-left">
            <h3 className="text-base font-semibold">{area.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{area.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {area.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
