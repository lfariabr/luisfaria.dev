/**
 * Curated portfolio content (single source of truth for the home + about pages).
 * Positioning is problem/outcome-led: "I solve real business problems with
 * software and data." Edit copy here - pages render from these values.
 */

export const POSITIONING = {
  badge: 'Software · Data Systems · Applied AI',
  headline: 'I build secure data products and applied ML systems.',
  subline:
    'Sydney-based Software & Data Engineer / Data & Systems Specialist. I ship production Next.js, SQL Server, Power BI, and ML systems across education and operations - then document the trade-offs in public.',
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
  { lens: 'Full-Stack Systems', clause: 'from UI to SQL.' },
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
    value: '171',
    label: 'ReviewPulse commits turning coursework into an inspectable NLP lab',
    href: 'https://github.com/lfariabr/review-pulse',
  },
  {
    value: '22 runs',
    label: 'Sommelier model comparison before production model replacement',
    href: 'https://github.com/lfariabr/sommelier-api',
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
    title: 'Software Engineering',
    blurb: 'Full-stack products shipped end-to-end - from a pentested 2,000-parent portal to internal Next.js tools backed by SQL Server and Microsoft Graph.',
    tags: ['Next.js', 'React', 'Node.js', 'GraphQL', 'Python', 'TypeScript'],
  },
  {
    key: 'data',
    icon: 'Database',
    title: 'Data Engineering',
    blurb: 'Pipelines and reporting people trust - source-controlled academic models, Power BI surfaces, and privacy-aware student data products.',
    tags: ['SQL Server', 'PostgreSQL', 'Power BI', 'Apache Superset', 'ETL'],
  },
  {
    key: 'automation',
    icon: 'Workflow',
    title: 'Automation & DevOps',
    blurb: 'I remove operational drag - self-service support kiosks, repeatable reporting runs, CI/CD gates, and production services that restart cleanly.',
    tags: ['Docker', 'GitHub Actions', 'NSSM', 'Nginx', 'Sentry'],
  },
  {
    key: 'ai',
    icon: 'Sparkles',
    title: 'AI / ML',
    blurb: 'Applied ML with honest metrics - ReviewPulse ABSA, Sommelier model governance, churn recall trade-offs, and a public agentic study pipeline.',
    tags: ['scikit-learn', 'PyTorch', 'FastAPI', 'Streamlit', 'LLM agents'],
  },
];

export type StackGroup = { label: string; items: string[] };

export const STACK_GROUPS: StackGroup[] = [
  {
    label: 'Software',
    items: ['TypeScript', 'React', 'Next.js', 'Node.js', 'GraphQL', 'Python'],
  },
  {
    label: 'Data',
    items: ['SQL Server', 'T-SQL', 'Power BI', 'Apache Superset', 'pandas', 'PySpark'],
  },
  {
    label: 'Automation & DevOps',
    items: ['Docker', 'GitHub Actions', 'NSSM', 'Nginx', 'Sentry'],
  },
  {
    label: 'AI / ML',
    items: ['scikit-learn', 'PyTorch', 'Transformers', 'FastAPI', 'Streamlit', 'Claude Code / Codex'],
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
    title: 'AI tooling with boundaries, evidence, and failure modes',
    summary:
      'I use agents to compress throughput, but I document where the human owns judgment: assessment decisions, source truth, defensive controls, and privacy boundaries.',
    bullets: [
      'Public agentic study pipeline: map, notes, compression, active recall, one-pagers, assessment checks.',
      'Technical reconstruction of the OpenAI-Hugging Face agent incident from public sources.',
      'Preference for explicit contracts, redaction, auditability, and default-deny thinking.',
    ],
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
