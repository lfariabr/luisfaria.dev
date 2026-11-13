/**
 * Curated portfolio content (single source of truth for the home + about pages).
 * Positioning is problem/outcome-led: "I solve real business problems with
 * software and data." Edit copy here - pages render from these values.
 */

export const POSITIONING = {
  /** Used by /about. */
  badge: 'Education Data · Applied ML · Agentic Delivery',
  /** The pill above the homepage headline. */
  eyebrow: 'Senior Software Engineer · Sydney',
  /** The homepage headline: `lead` plain, `accent` in emerald. One fixed line (#442). */
  headline: { lead: 'Ten years of shipping software that', accent: 'real people depend on.' },
  subline:
    "I'm Luis. Right now I'm building a parent portal used by 2,000 families, the data systems behind a school, and a master's in software engineering with AI. I ship with agentic tooling, and I write up how it works in public.",
} as const;

export type HeroMetric = { value: string; label: string; accent?: boolean; href?: string };

/** Concrete proof points shown as a 4-card metrics row under the hero headline. */
export const HERO_METRICS: HeroMetric[] = [
  { value: '10+ yrs', label: 'shipping software, data and automation systems' },
  {
    value: '2,000',
    label: 'parents on a pentested portal I shipped solo in 8 weeks',
    accent: true,
    href: 'https://dev.to/lfariaus/2000-parents-1-rule-0-leaks-a-pentested-school-parent-portal-in-8-weeks-2bp8',
  },
  { value: '2,000+', label: 'PRs merged to production with an agentic workflow' },
  {
    value: '1,400+',
    label: "commits on my open-source master's pipeline",
    href: 'https://dev.to/lfariaus/12-modules-12-weeks-1-pipeline-studying-a-masters-with-agentic-ai-1ohg',
  },
];

export type WorkArea = { label: string; blurb: string; items: string[] };

/** "What I work with": the four areas, each listed once (#490 merged Pillars + Stack). */
export const WORK_AREAS: WorkArea[] = [
  {
    label: 'Production systems',
    blurb: 'Secure, auditable, handed over',
    items: ['Next.js', 'TypeScript', 'Python', 'SQL Server', 'Microsoft Entra ID'],
  },
  {
    label: 'Data & analytics',
    blurb: 'Built close to operations',
    items: ['T-SQL', 'Power BI', 'Power Query', 'SSIS / ETL', 'pandas', 'PySpark'],
  },
  {
    label: 'Applied ML',
    blurb: 'Models handled like products',
    items: ['PyTorch', 'scikit-learn', 'Transformers', 'Streamlit', 'FastAPI'],
  },
  {
    label: 'Delivery & agents',
    blurb: 'How it gets to production',
    items: ['Claude Code', 'Codex', 'Docker', 'GitHub Actions', 'Nginx', 'Sentry'],
  },
];

export type BuildingNow = {
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
  cta: string;
  /** Optional small credit line under the summary. */
  credit?: { lead: string; label: string; href: string };
};

/** "What I'm building now": three first-person cards (#490). */
export const BUILDING_NOW: BuildingNow[] = [
  {
    eyebrow: 'School data products',
    title: 'A parent portal for 2,000 families',
    summary:
      'Seven modules reading live school data, pentested before launch, with authorization rechecked at the data boundary. I built it solo in 8 weeks and it has kept shipping: parents now notify absences online, live since 11 November. I load-tested the morning rush at 1, 10, 100 and 500 parents at once. Every request was answered, every absence notice landed, zero errors. Making it faster under load is the next job.',
    credit: {
      lead: 'Load test inspired by',
      label: 'Scaling Slack and GitHub with Maude Lemaire (The Pragmatic Engineer)',
      href: 'https://youtu.be/x6WqD4qHxSc',
    },
    href: 'https://dev.to/lfariaus/2000-parents-1-rule-0-leaks-a-pentested-school-parent-portal-in-8-weeks-2bp8',
    cta: 'Read the write-up',
  },
  {
    eyebrow: 'Master’s, shipped',
    title: 'Coursework that turns into real software',
    summary:
      'ReviewPulse for sentiment analysis you can inspect, Sommelier API for model governance, and churn analysis tuned for recall and cost instead of vanity accuracy.',
    href: '/work/review-pulse-v3',
    cta: 'See the ML work',
  },
  {
    eyebrow: 'Open source',
    title: 'Fixing the tools I use, upstream',
    summary:
      'My fix to node-mssql, the SQL Server driver behind the parent portal, shipped in 12.7.14, and a second is in review. This site is open source down to its ADRs, and so is the pull-up timer I train with.',
    href: 'https://github.com/search?q=author%3Alfariabr+is%3Apr+is%3Amerged+-user%3Alfariabr&type=pullrequests',
    cta: 'See my contributions',
  },
];

/** "How I ship": the agent roles, and the human who decides (#490). */
export const HOW_I_SHIP = {
  paragraphs: [
    'My workflow is agentic: a handful of AI agents, each with one job and written rules for doing it. One plans, one implements, others review architecture, security and UX. They draft. I decide what merges, and I’m the engineer of record for all of it.',
    'That workflow has merged more than 2,000 pull requests to production since May 2026. My master’s runs on the same idea in the open: a 1,400-commit study pipeline anyone can read.',
  ],
  roles: [
    { role: 'lead engineer', does: 'plans' },
    { role: 'delivery', does: 'builds' },
    { role: 'architecture', does: 'audits' },
    { role: 'security', does: 'reviews' },
    { role: 'pr review', does: 'gates' },
    { role: 'ux', does: 'reviews' },
    { role: 'me', does: 'decides what merges', human: true },
  ],
} as const;

export type Article = { date: string; title: string; href: string };

/**
 * "Latest writing": the three newest dev.to articles, newest first (#491).
 * Static for now; making it update itself is #336.
 */
export const LATEST_WRITING: Article[] = [
  {
    date: '2026-11-01',
    title: 'I attempted 2,000 pull-ups. The next morning, I open-sourced my timer.',
    href: 'https://dev.to/lfariaus/i-attempted-2000-pull-ups-the-next-morning-i-open-sourced-my-timer-31h',
  },
  {
    date: '2026-10-19',
    title: '35 seconds to log a coffee: what one screen recording taught me about iPhone Safari',
    href: 'https://dev.to/lfariaus/35-seconds-to-log-a-coffee-what-one-screen-recording-taught-me-about-iphone-safari-32a5',
  },
  {
    date: '2026-08-28',
    title: 'What happens between a token and a prediction? Making sentiment models inspectable',
    href: 'https://dev.to/lfariaus/what-happens-between-a-token-and-a-prediction-making-sentiment-models-inspectable-2p0c',
  },
];

/** "Off the clock": a small personal strip (#491). */
export const OFF_THE_CLOCK = {
  pullUps: {
    title: 'Pull-ups',
    blurb: 'EMOM sessions, the timer I built for them, and one attempt at 2,000.',
    href: 'https://emom-pullups.vercel.app',
  },
  goggins: {
    title: 'Goggins mode',
    blurb: 'Ask the site to email you a motivational scream. Two a day, max.',
  },
  apod: {
    title: 'Picture of the day',
    blurb: 'NASA’s astronomy photo, one click away.',
  },
} as const;

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
