import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { CORE_STACK } from "@/utils/data";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b from-background to-slate-50 dark:from-background dark:to-slate-950">
        {/* Hero Section */}
        <div className="container max-w-4xl px-6 py-16 space-y-12">
          {/* Hero Copy */}
          <div className="space-y-8 sm:space-y-10 text-center">
            {/* Badge */}
            <p className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1 text-xs font-medium text-muted-foreground">
              Senior Software Engineer & Project Lead · Master&apos;s SWE & AI
            </p>

            {/* Heading + subheading */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight sm:text-5xl lg:text-6xl">
                I build end-to-end systems
                <span className="block bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  that turn manual workflows into scalable products.
                </span>
              </h1>

              <p className="mx-auto max-w-[720px] text-base text-muted-foreground sm:text-lg">
                I&apos;m Luis, a Senior Software Engineer with 10+ years leading technical projects 
                end-to-end across healthcare, tech, agencies, and games. I ship production-ready 
                solutions that turn messy processes into automated, KPI-driven workflows.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/projects">View featured work</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/chatbot">Try my AI assistant</Link>
              </Button>
            </div>

            {/* Core stack pills */}
            <div className="mt-10 sm:mt-12 rounded-2xl border bg-card p-5 sm:p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Core Stack
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-[11px] sm:text-xs">
                {CORE_STACK.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-3 py-1.5 font-medium transition-colors hover:bg-muted/80">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics - Impact at a Glance */}
          <section className="border-y bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            <div className="mx-auto max-w-6xl px-4 py-16">
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Impact at a glance</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Real metrics from production systems I've built and scaled
                </p>
              </div>

              {/* Grid of Metrics */}
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

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
