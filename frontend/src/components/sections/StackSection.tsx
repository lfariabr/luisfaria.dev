import { STACK_GROUPS } from '@/content/profile';

interface StackSectionProps {
  heading?: string;
  className?: string;
}

/** Core stack, grouped by pillar (replaces the old flat pill list). */
export function StackSection({ heading = 'Core stack', className }: StackSectionProps) {
  return (
    <section className={className}>
      {heading ? (
        <h2 className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {STACK_GROUPS.map((group) => (
          <div key={group.label} className="rounded-2xl border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted/80"
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
