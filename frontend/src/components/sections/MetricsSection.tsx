export function MetricsSection() {
  return (
    <section className="border-y bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Impact at a glance</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real metrics from production systems I've built and scaled
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Scale & Automation */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Scale & Automation
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">30K+</p>
                <p className="text-xs text-muted-foreground">Messages automated/month</p>
              </div>
              <div>
                <p className="text-3xl font-bold">1M+</p>
                <p className="text-xs text-muted-foreground">Client records managed</p>
              </div>
              <div>
                <p className="text-3xl font-bold">20+</p>
                <p className="text-xs text-muted-foreground">Clinics onboarded</p>
              </div>
            </div>
          </div>

          {/* Time & Cost Savings */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-sky-500">
              Time & Cost Savings
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">20+ hrs</p>
                <p className="text-xs text-muted-foreground">Saved weekly via ad automation</p>
              </div>
              <div>
                <p className="text-3xl font-bold">50%</p>
                <p className="text-xs text-muted-foreground">Email costs reduced</p>
              </div>
              <div>
                <p className="text-3xl font-bold">8+ hrs</p>
                <p className="text-xs text-muted-foreground">Saved weekly with BI dashboards</p>
              </div>
            </div>
          </div>

          {/* Business Impact */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-500">
              Business Impact
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">+15%</p>
                <p className="text-xs text-muted-foreground">Marketing ROI improvement</p>
              </div>
              <div>
                <p className="text-3xl font-bold">+20%</p>
                <p className="text-xs text-muted-foreground">Client engagement (GenAI)</p>
              </div>
              <div>
                <p className="text-3xl font-bold">99.9%</p>
                <p className="text-xs text-muted-foreground">Credential theft prevention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}