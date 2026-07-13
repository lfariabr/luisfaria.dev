/**
 * Curated portfolio content (single source of truth for the home + about pages).
 * Positioning is problem/outcome-led: "I solve real business problems with
 * software and data." Edit copy here — pages render from these values.
 */

export const POSITIONING = {
  badge: 'Engineer · Data · Automation · AI',
  headline: 'I solve real business problems with software and data.',
  subline:
    'I turn messy, manual work into automated, KPI-driven systems — data, full-stack, and ML. 10+ years end-to-end; now at St Catherine’s, Sydney.',
} as const;

/** Full, static canonical phrase — the accessible/SEO text rendered in the hero <h1>. */
export const HERO_CANONICAL_PHRASE = 'I build systems that pay for themselves.';

export type HeroFrame = { lens: string; clause: string };

/**
 * Rotating hero frames: lens label (pill) + green clause. Order is ML → Data →
 * Full-Stack → Hybrid; Hybrid is canonical and renders first (SSR + no-JS + reduced-motion).
 */
export const HERO_FRAMES: HeroFrame[] = [
  { lens: 'ML Engineer', clause: 'with production-grade ML.' },
  { lens: 'Data Engineer', clause: 'from raw data to decisions.' },
  { lens: 'Full-Stack Engineer', clause: 'end-to-end, frontend to infra.' },
  { lens: 'Hybrid', clause: 'that pay for themselves.' },
];

/** Index of the canonical frame (Hybrid) used for first paint and reduced-motion. */
export const HERO_CANONICAL_INDEX = 3;

export type HeroMetric = { value: string; label: string; accent?: boolean };

/** Concrete proof points shown as a 4-card metrics row under the hero headline. */
export const HERO_METRICS: HeroMetric[] = [
  { value: '10+ yrs', label: 'building software, data & AI systems end-to-end' },
  { value: '2,000 users', label: 'pentested portal, shipped solo in 8 weeks', accent: true },
  { value: '30K+', label: 'messages automated every month' },
  { value: '1M+', label: 'client records managed in production' },
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
    blurb: 'Full-stack products shipped end-to-end — most recently a pentested portal serving 2,000 parents, built solo in 8 weeks.',
    tags: ['Next.js', 'React', 'Node.js', 'GraphQL', 'Python', 'TypeScript'],
  },
  {
    key: 'data',
    icon: 'Database',
    title: 'Data Engineering',
    blurb: 'Pipelines, reporting and BI people trust — from reverse-engineering legacy ETL estates to dashboards leadership actually uses.',
    tags: ['SQL Server', 'PostgreSQL', 'Power BI', 'Apache Superset', 'ETL'],
  },
  {
    key: 'automation',
    icon: 'Workflow',
    title: 'Automation & DevOps',
    blurb: 'I find manual work and delete it — a 100-minute batch job cut to ~2 seconds; deploy downtime from 10+ minutes to ~2s.',
    tags: ['Docker', 'GitHub Actions', 'Celery / Redis', 'Nginx', 'Sentry'],
  },
  {
    key: 'ai',
    icon: 'Sparkles',
    title: 'AI / ML',
    blurb: 'Applied ML with honest metrics — deployed scikit-learn services, RAG assistants, and a 1,100+ commit open-source agentic pipeline.',
    tags: ['scikit-learn', 'FastAPI', 'OpenAI', 'Claude', 'RAG / agents'],
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
    items: ['SQL Server', 'PostgreSQL', 'Power BI', 'Apache Superset', 'pandas', 'Redis'],
  },
  {
    label: 'Automation & DevOps',
    items: ['Docker', 'GitHub Actions', 'Celery', 'Nginx', 'Sentry'],
  },
  {
    label: 'AI / ML',
    items: ['scikit-learn', 'OpenAI', 'Claude', 'RAG', 'Claude Code / agents'],
  },
];

/** First-person narrative for the About page (problem/outcome-led, grounded). */
export const ABOUT_BIO: string[] = [
  'I’m Luis Faria, a software and data engineer based in Sydney. For 10+ years I’ve built systems that turn manual, messy processes into automated, measurable products — across healthcare, marketing agencies, and tech.',
  'I led technical projects and delivered custom ERP/CRM platforms for a 20+ clinic healthcare group serving 1M+ client records, then built Konquista, a Django + Celery/Redis automation platform pushing 30K+ WhatsApp messages a month across clinics. After relocating to Sydney, I moved deeper into data and software engineering.',
  'Today I build data systems at St Catherine’s School, Sydney — SQL Server pipelines and Power BI reporting that give staff reliable, decision-ready numbers in a regulated educational environment.',
  'I’m completing a Master of Software Engineering with AI, and I keep the learning applied: secure cloud architectures on AWS, a self-hosted Apache Superset BI deployment, applied machine learning (scikit-learn, CRISP-DM), and LLM tooling on OpenAI and Claude. I build in public — shipping, writing, and sharing the wins and the scars.',
];

export const SOCIALS = {
  github: 'https://github.com/lfariabr',
  linkedin: 'https://linkedin.com/in/lfariabr',
  devto: 'https://dev.to/lfariaus',
  mastersRepo: 'https://github.com/lfariabr/masters-swe-ai',
  email: 'lfariabr@gmail.com',
  location: 'Sydney, Australia',
} as const;
