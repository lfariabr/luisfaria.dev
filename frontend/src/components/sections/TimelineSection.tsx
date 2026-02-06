import Link from "next/link";

export function TimelineSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="space-y-6">
        <h2 className="text-2xl text-center font-bold tracking-tight">Timeline at a glance</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          Key career milestones and technical achievements
        </p>

        <ol className="space-y-6 border-l-2 border-border pl-6 text-sm" aria-label="Career timeline">

          <li>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2016–2018
            </span>
            <p className="mt-1">
              Tech Project Manager at ABlab Marketing, coordinating 3 agile squads and delivering 
              digital projects for clients such as Sodexo, Citroën, and Tegra/Brookfield.
            </p>
          </li>

          <li>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2018–2023
            </span>
            <p className="mt-1">
              Transitioned into Software Engineering, leading development of a custom ERP & CRM 
              (Laravel + React + PostgreSQL) for a 20+-clinic healthcare group serving 1M+ client records. 
              Built BI dashboards, automated ad spend processes, and shipped data-driven lead scoring.
            </p>
          </li>

          <li>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2023–2024
            </span>
            <p className="mt-1">
              Designed and launched{" "}
              <Link
                href="/projects/konquista-from-spreadsheet-chaos-to-1000-whatsapp-messages-a-day"
                className="font-semibold underline underline-offset-4 hover:text-emerald-500"
              >
                Konquista
              </Link>
              , a Django + Celery/Redis WhatsApp automation platform powering 30K+ monthly messages 
              across all clinics. Expanded Python expertise across FastAPI, Flask, and Streamlit 
              to support production-grade ML and automation pipelines.
            </p>
          </li>

          <li>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2024
            </span>
            <p className="mt-1">
              Relocated to Sydney and continued delivering for international clients across time zones. 
              Strengthened backend architecture expertise, designed scalable Python systems, and completed 
              Stanford&apos;s Machine Learning Specialization to deepen AI/ML capabilities.
            </p>
          </li>

          <li>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2025
            </span>
            <p className="mt-1">
              Pursuing Master&apos;s in Software Engineering & AI while expanding full-stack capabilities. 
              Shipped{" "}
              <Link
                href="/projects/from-groomzilla-to-full-stack-engineer-building-wedstack"
                className="font-semibold underline underline-offset-4 hover:text-emerald-500"
              >
                Wedstack
              </Link>
              {" "} (Next.js + GraphQL + Stripe), built AI-powered tools with OpenAI integration, and published 
              engineering insights on Dev.to.
            </p>
          </li>

          <li>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2026
            </span>
            <p className="mt-1">
              Joined St Catherine's School Sydney as a Data Analyst, building SQL Server pipelines 
              and reporting workflows in a regulated educational environment. Established data 
              foundations for analytics and ML initiatives while continuing Master's studies.{" "}
              <Link
                href="/projects/learning-sql-server-the-hard-way-16-days-of-real-world-database-work"
                className="font-semibold underline underline-offset-4 hover:text-emerald-500"
              >
                Read the preparation story →
              </Link>
            </p>
          </li>

        </ol>
      </div>
    </section>
  );
}