/**
 * Curated career timeline (single source of truth for the home section and the
 * dedicated /timeline page). Oldest → newest. Edit copy here.
 */

import { SOCIALS } from './profile';

export type TimelineEntry = {
  period: string;
  body: string;
  /** Related internal links (e.g. a project), shown as chips after the body. */
  links?: { label: string; href: string }[];
};

export const TIMELINE: TimelineEntry[] = [
  {
    period: '2016–2018',
    body: 'Tech Project Manager at ABlab Marketing, coordinating 3 agile squads and delivering digital projects for clients such as Sodexo, Citroën, and Tegra/Brookfield.',
  },
  {
    period: '2018–2023',
    body: 'Transitioned into software engineering, leading development of a custom ERP & CRM (Laravel + React + PostgreSQL) for a 20+-clinic healthcare group serving 1M+ client records. Built BI dashboards, automated ad-spend processes, and shipped data-driven lead scoring.',
  },
  {
    period: '2023–2024',
    body: 'Designed and launched Konquista, a Django + Celery/Redis WhatsApp automation platform powering 30K+ monthly messages across all clinics. Expanded Python expertise across FastAPI, Flask, and Streamlit for production-grade ML and automation pipelines.',
    links: [
      {
        label: 'Konquista',
        href: '/projects/konquista-from-spreadsheet-chaos-to-1000-whatsapp-messages-a-day',
      },
    ],
  },
  {
    period: '2024',
    body: 'Relocated to Sydney and continued delivering for international clients across time zones. Strengthened backend architecture, designed scalable Python systems, and completed Stanford’s Machine Learning Specialization.',
  },
  {
    period: '2025',
    body: 'Pursuing a Master’s in Software Engineering & AI while expanding full-stack capabilities. Shipped Wedstack (Next.js + GraphQL + Stripe), built AI tools on OpenAI, and published 30+ engineering write-ups on dev.to.',
    links: [
      {
        label: 'Wedstack',
        href: '/projects/from-groomzilla-to-full-stack-engineer-building-wedstack',
      },
      {
        label: 'Master’s repo (GitHub)',
        href: SOCIALS.mastersRepo,
      },
      {
        label: 'Writing on dev.to',
        href: SOCIALS.devto,
      },
    ],
  },
  {
    period: '2026',
    body: 'Joined St Catherine’s School, Sydney and moved into Data & Systems Specialist work: secure Next.js products, SQL Server pipelines, Power BI reporting, academic-data modernisation, FreshService and Schoolbox support, and Student360-style data surfaces - while completing ML, Deep Learning, and Big Data subjects in the Master’s.',
    links: [
      {
        label: 'Parent portal write-up',
        href: 'https://dev.to/lfariaus/2000-parents-1-rule-0-leaks-a-pentested-school-parent-portal-in-8-weeks-2bp8',
      },
      {
        label: 'ReviewPulse',
        href: 'https://github.com/lfariabr/review-pulse',
      },
      {
        label: 'Sommelier API',
        href: 'https://github.com/lfariabr/sommelier-api',
      },
    ],
  },
];
