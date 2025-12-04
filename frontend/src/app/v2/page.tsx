import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b from-background to-slate-50 dark:from-background dark:to-slate-950">
        {/* Hero Section */}
        <main className="container max-w-4xl px-6 py-16 space-y-12">
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
                end-to-end across healthcare, tech, agencies and games. I ship solutions that turn
                messy processes into automated, KPI-driven workflows.
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
            <div className="mt-10 sm:mt-12 rounded-2xl border bg-card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Core stack
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-[11px] sm:text-xs">
                {[
                  "Python (Django, FastAPI, Flask)",
                  "Node.js",
                  "TypeScript",
                  "React & Next.js",
                  "GraphQL APIs",
                  "PostgreSQL · MongoDB · Redis",
                  "Docker & NGINX",
                  "Pandas · Scikit-Learn · Streamlit",
                ].map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-3 py-1.5 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
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

        {/* Featured Projects */}
        <section
          id="projects"
          className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:py-20"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Featured projects
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Real systems used in production. I design the architecture, write
                the code, and own the rollout.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              See all projects
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Project 1 */}
            <article className="group flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                  Internal SaaS · Messaging Automation
                </p>
                <h3 className="text-xl font-semibold">
                  Konquista — WhatsApp Automation Platform
                </h3>
                <p className="text-sm text-muted-foreground">
                  Django + Celery + Redis + WhatsApp API platform powering
                  personalised campaigns across 20+ clinics, handling 30K+ monthly
                  messages and 1M+ client records.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Asynchronous messaging engine with job queues</li>
                  <li>• Role-based access for clinic teams & marketing</li>
                  <li>• Automatic lead follow-up and re-engagement flows</li>
                  <li>• Observability via structured logging & dashboards</li>
                </ul>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {["Django", "Celery", "Redis", "PostgreSQL", "Docker"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 font-medium"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </article>

            {/* Project 2 */}
            <article className="group flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                  AI · Concierge Operations
                </p>
                <h3 className="text-xl font-semibold">
                  ExcelPilot — AI Assistant for Building Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  An AI co-pilot that turns messy logs, emails, and incidents into
                  structured knowledge for building managers and concierge teams.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• GraphQL API backed by Redis and OpenAI</li>
                  <li>• Synthesises incidents, tasks, and follow-ups</li>
                  <li>• Designed as a reusable agent layer for future tools</li>
                  <li>• Built with testable, modular backend architecture</li>
                </ul>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {["Node.js", "TypeScript", "GraphQL", "Redis", "OpenAI API"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 font-medium"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </article>
          </div>
        </section>

        {/* Articles & Writing */}
        <section className="mx-auto max-w-6xl space-y-6 px-4 pb-16 md:pb-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Articles & writing
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                I write to clarify my thinking. Topics include AI product design,
                system architecture, and lessons from running software in the
                real world.
              </p>
            </div>
            <Link
              href="/articles"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              View all articles
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Teaching AI to respect rate limits",
                desc: "Designing human-centred throttling for autonomous agents.",
              },
              {
                title: "From spreadsheets to SaaS",
                desc: "Shipping Konquista and transforming clinic operations.",
              },
              {
                title: "What marathon training taught me about code",
                desc: "On endurance, refactoring, and long-term systems.",
              },
            ].map((post) => (
              <article
                key={post.title}
                className="rounded-2xl border bg-card p-5 transition-all hover:shadow-lg"
              >
                <h3 className="text-sm font-semibold">
                  {post.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">{post.desc}</p>
                <button className="mt-3 text-xs font-medium underline-offset-4 hover:underline">
                  Read article
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* AI Assistant - Live Demo */}
        <section
          id="assistant"
          className="border-y bg-muted/30"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                Live Demo
              </p>
              <h2 className="text-3xl font-bold tracking-tight">
                Chat with my custom AI assistant
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                This agent runs on top of my own APIs and structured knowledge
                base. It can walk you through my projects, explain architectural
                choices, and answer questions about my experience.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Built with OpenAI, GraphQL, and Redis</li>
                <li>• Context-aware, grounded on my real project docs</li>
                <li>• Designed as a reusable agent layer for future products</li>
              </ul>
              <Button asChild className="mt-5 rounded-full px-6">
                <Link href="/chatbot">
                  Open AI Assistant
                </Link>
              </Button>
            </div>

            <div className="flex-1">
              {/* Simple assistant mock UI */}
              <div className="mx-auto max-w-md rounded-3xl border bg-card p-4 text-xs shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <p className="text-[11px] text-muted-foreground">
                      Luis AI · Online
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                    Powered by Luis&apos; backend
                  </span>
                </div>
                <div className="space-y-3 rounded-2xl bg-muted/50 p-3">
                  <div className="max-w-[80%] rounded-2xl bg-muted p-3 text-[11px]">
                    How does Konquista scale WhatsApp campaigns across 20+
                    clinics?
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-2xl bg-primary p-3 text-[11px] text-primary-foreground">
                    Konquista uses Celery workers with Redis as a broker to queue
                    messages per clinic, enforcing rate limits and retries so no
                    campaign overwhelms the provider…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline at a Glance */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Timeline at a glance
            </h2>
            <ol className="space-y-6 border-l-2 border-border pl-6 text-sm">
              <li>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2018–2023
                </span>
                <p className="mt-1">
                  Built and maintained internal ERP & CRM systems for a
                  multi-clinic healthcare group.
                </p>
              </li>
              <li>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2023–2024
                </span>
                <p className="mt-1">
                  Designed and shipped Konquista, a WhatsApp automation platform
                  used across 20+ clinics.
                </p>
              </li>
              <li>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2024
                </span>
                <p className="mt-1">
                  Moved to Sydney, started a Master&apos;s in Software Engineering
                  & AI, and began building AI-powered tools.
                </p>
              </li>
              <li>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2025 →
                </span>
                <p className="mt-1">
                  Focusing on AI systems, backend architecture, and high-impact
                  engineering roles in Australia.
                </p>
              </li>
            </ol>
          </div>
        </section>
        </main>
      </div>
    </MainLayout>
  );
}
