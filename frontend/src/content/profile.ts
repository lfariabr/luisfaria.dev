/**
 * Curated portfolio content (single source of truth for the home + about pages).
 * Positioning is problem/outcome-led: "I solve real business problems with
 * software and data." Edit copy here - pages render from these values.
 */

export const POSITIONING = {
  badge: 'Education Data · Applied ML · Agentic Delivery',
  headline: 'I build data systems that survive real users, audits, and handover.',
  subline:
    'Sydney-based Senior Software Engineer and Data & Systems Specialist. Current work spans SQL Server, Power BI, Next.js, secure school data products, applied ML, and agentic AI workflows documented in public.',
} as const;

/** Full, static canonical phrase - the accessible/SEO text rendered in the hero <h1>. */
export const HERO_CANONICAL_PHRASE = 'I build secure data products and applied ML systems that survive production.';

export type HeroFrame = { lens: string; clause: string };

/**
 * Rotating hero frames: lens label (pill) + green clause.
 * Production Proof is canonical and renders first (SSR + no-JS + reduced-motion).
 */
export const HERO_FRAMES: HeroFrame[] = [
  { lens: 'Education Data', clause: 'with privacy boundaries.' },
  { lens: 'Applied ML', clause: 'with honest metrics.' },
  { lens: 'Agentic AI', clause: 'with public receipts.' },
  { lens: 'Production Proof', clause: 'that survives go-live.' },
];

/** Index of the canonical frame used for first paint and reduced-motion. */
export const HERO_CANONICAL_INDEX = 3;

export type HeroMetric = { value: string; label: string; accent?: boolean; href?: string };

/** Concrete proof points shown as a 4-card metrics row under the hero headline. */
export const HERO_METRICS: HeroMetric[] = [
  { value: '10+ yrs', label: 'shipping software, data, and automation systems' },
  {
    value: '2,000 users',
    label: 'pentested parent portal, shipped solo in 8 weeks',
    accent: true,
    href: 'https://dev.to/lfariaus/2000-parents-1-rule-0-leaks-a-pentested-school-parent-portal-in-8-weeks-2bp8',
  },
  {
    value: '200+',
    label: 'ReviewPulse commits turning coursework into an inspectable NLP lab',
    href: 'https://github.com/lfariabr/review-pulse',
  },
  {
    value: '1,400+',
    label: 'commits on an open-source agentic study pipeline',
    href: 'https://dev.to/lfariaus/12-modules-12-weeks-1-pipeline-studying-a-masters-with-agentic-ai-1ohg',
  },
];

export type Pillar = {
  key: string;
  /** lucide-react icon name, mapped to a component at render time. */
  icon: 'Code2' | 'Database' | 'Workflow' | 'Sparkles';
  title: string;
  blurb: string;
  tags: string[];
};

export const PILLARS: Pillar[] = [
  {
    key: 'software',
    icon: 'Code2',
    title: 'Secure education systems',
    blurb: 'School-facing products and internal tools where authorization, privacy, auditability, and handover are part of the design - not cleanup work after launch.',
    tags: ['Next.js', 'TypeScript', 'SQL Server', 'Microsoft Entra ID', 'Python'],
  },
  {
    key: 'data',
    icon: 'Database',
    title: 'Data engineering & analytics',
    blurb: 'SQL Server, Power BI, ETL, and reporting workflows built close to operations: finance, enrolments, academic data, support, and stakeholder dashboards.',
    tags: ['SQL Server', 'T-SQL', 'Power BI', 'Power Query', 'ETL'],
  },
  {
    key: 'automation',
    icon: 'Workflow',
    title: 'Applied ML systems',
    blurb: 'Models handled like production assets: evaluation contracts, artifact provenance, failure visibility, and interfaces that make trade-offs inspectable.',
    tags: ['PyTorch', 'scikit-learn', 'Transformers', 'Streamlit', 'FastAPI'],
  },
  {
    key: 'ai',
    icon: 'Sparkles',
    title: 'Agentic AI delivery',
    blurb: 'Claude Code and Codex workflows used with explicit source truth, review gates, redaction, and public write-ups showing what the agent did and what stayed human-owned.',
    tags: ['Claude Code', 'Codex', 'GitHub', 'Dev.to', 'AI security'],
  },
];

export type StackGroup = { label: string; items: string[] };

export const STACK_GROUPS: StackGroup[] = [
  {
    label: 'Production systems',
    items: ['Next.js', 'TypeScript', 'Python', 'SQL Server', 'Microsoft Entra ID'],
  },
  {
    label: 'Data & analytics',
    items: ['T-SQL', 'Power BI', 'Power Query', 'SSIS / ETL', 'pandas', 'PySpark'],
  },
  {
    label: 'Applied ML',
    items: ['PyTorch', 'scikit-learn', 'Transformers', 'Streamlit', 'FastAPI'],
  },
  {
    label: 'Delivery & agents',
    items: ['Docker', 'GitHub Actions', 'Nginx', 'Sentry', 'Claude Code / Codex'],
  },
];

export type CurrentProof = {
  title: string;
  eyebrow: string;
  summary: string;
  bullets: string[];
  href?: string;
  cta?: string;
};

export const CURRENT_PROOF: CurrentProof[] = [
  {
    eyebrow: 'Education data products',
    title: 'Secure systems for real school operations',
    summary:
      'Current work is production-facing: parent access, student-profile views, support workflows, academic reporting, and portal migration support in a regulated school environment.',
    bullets: [
      'Pentested 2,000-parent portal with authorization rechecked at the data boundary.',
      'Student360-style profile surfaces built around mock/public safety and local-only live-data gates.',
      'FreshService kiosk and Schoolbox data support shipped with operational handover in mind.',
    ],
    href: '/work/st-catherines-data-systems',
    cta: 'Read education case study',
  },
  {
    eyebrow: 'Applied ML systems',
    title: 'Models treated as products, not notebook trophies',
    summary:
      'Recent ML work focuses on leakage-safe evaluation, model selection, artifact provenance, deployment trade-offs, and interfaces that expose where predictions fail.',
    bullets: [
      'ReviewPulse v3: aspect-based sentiment lab with six model paths and token-level evidence.',
      'Sommelier API: 22 model/treatment runs before replacing the shipped classifier.',
      'Churn analysis: optimized for recall and cost trade-offs instead of vanity accuracy.',
    ],
    href: '/work/review-pulse-v3',
    cta: 'See ML proof',
  },
  {
    eyebrow: 'Agentic AI + security',
    title: 'Agentic AI workflows with public receipts',
    summary:
      'I use agents to compress throughput, but I document where the human owns judgment: assessment decisions, source truth, defensive controls, and privacy boundaries.',
    bullets: [
      'Public agentic study pipeline: map, notes, compression, active recall, one-pagers, assessment checks.',
      'Technical reconstruction of the OpenAI-Hugging Face agent incident from public sources.',
      'Preference for explicit contracts, redaction, auditability, and default-deny thinking.',
    ],
    href: 'https://dev.to/lfariaus/12-modules-12-weeks-1-pipeline-studying-a-masters-with-agentic-ai-1ohg',
    cta: 'Read agentic AI write-up',
  },
];

/** First-person narrative for the About page (problem/outcome-led, grounded). */
export const ABOUT_BIO: string[] = [
  'I’m Luis Faria, a software and data engineer based in Sydney. For 10+ years I’ve built systems that turn manual, messy processes into automated, measurable products - across healthcare, marketing agencies, tech, and education.',
  'I led technical projects and delivered custom ERP/CRM platforms for a 20+ clinic healthcare group serving 1M+ client records, then built Konquista, a Django + Celery/Redis automation platform pushing 30K+ WhatsApp messages a month across clinics. That operating background still shapes how I build: ship the system, measure the outcome, own the handover.',
  'Today I work as a Data & Systems Specialist at St Catherine’s School, Sydney. The public-safe version: Next.js products, SQL Server pipelines, Power BI reporting, academic data modernisation, and cross-system integrations where privacy and authorization are non-negotiable.',
  'I’m completing a Master of Software Engineering with AI, and the coursework keeps becoming shipped software: ReviewPulse for inspectable sentiment analysis, Sommelier API for model governance and deployment trade-offs, PySpark churn analysis, secure cloud architecture, and an agentic study pipeline documented in public.',
];

export const SOCIALS = {
  github: 'https://github.com/lfariabr',
  linkedin: 'https://linkedin.com/in/lfariabr',
  devto: 'https://dev.to/lfariaus',
  mastersRepo: 'https://github.com/lfariabr/masters-swe-ai',
  email: 'lfariabr@gmail.com',
  location: 'Sydney, Australia',
} as const;
