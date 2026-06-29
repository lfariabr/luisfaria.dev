import { METRIC_GROUPS } from '@/content/metrics';

export function MetricsSection() {
  return (
    <section className="border-y bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Impact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real, concrete results from systems I&apos;ve built, scaled, and run.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {METRIC_GROUPS.map((group) => (
            <div key={group.label} className="rounded-2xl border bg-card p-6 shadow-sm">
              <p className={`mb-4 text-xs font-semibold uppercase tracking-wider ${group.accent}`}>
                {group.label}
              </p>
              <div className="space-y-4">
                {group.stats.map((stat) => (
                  <div key={stat.caption}>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
