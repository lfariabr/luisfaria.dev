import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { CORE_STACK } from "@/utils/data";
import { MetricsSection } from "@/components/sections/MetricsSection";
import { TimelineSection } from "@/components/sections/TimelineSection";

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
            <MetricsSection />
          </div>
          <TimelineSection />
        </div>
      </div>
    </MainLayout>
  );
}
