/**
 * Curated portfolio content (single source of truth for the home + about pages).
 * Positioning is problem/outcome-led: "I solve real business problems with
 * software and data." Edit copy here — pages render from these values.
 */

export const POSITIONING = {
  badge: 'Engineer · Data · Automation · AI',
  headline: 'I solve real business problems with software and data.',
  subline:
    'I turn messy, manual workflows into automated, KPI-driven systems — internal tools, data pipelines, dashboards, and AI assistants. 10+ years shipping end-to-end across healthcare, agencies, and tech; now building data systems at St Catherine’s School, Sydney.',
  // Short, concrete proof points shown as a strip under the hero.
  proof: [
    'Healthcare ERP/CRM',
    '30K+ msgs automated / mo',
    '1M+ client records',
    'SQL Server pipelines & BI',
  ],
} as const;

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
    blurb: 'Full-stack apps and internal systems, designed and shipped end-to-end.',
    tags: ['Next.js', 'React', 'Node.js', 'GraphQL', 'Python', 'TypeScript'],
  },
  {
    key: 'data',
    icon: 'Database',
    title: 'Data Engineering',
    blurb: 'Pipelines, reporting and BI that turn raw data into decisions people trust.',
    tags: ['SQL Server', 'PostgreSQL', 'Power BI', 'Apache Superset', 'ETL'],
  },
  {
    key: 'automation',
    icon: 'Workflow',
    title: 'Automation & DevOps',
    blurb: 'Removing manual work with workflows, CI/CD, and observability.',
    tags: ['Docker', 'GitHub Actions', 'Celery / Redis', 'Nginx', 'Sentry'],
  },
  {
    key: 'ai',
    icon: 'Sparkles',
    title: 'AI / ML',
    blurb: 'Applied ML and LLM-powered tools — scikit-learn models, RAG assistants, and AI-augmented delivery.',
    tags: ['scikit-learn', 'OpenAI', 'Claude', 'RAG / assistants', 'CRISP-DM', 'Stanford ML', 'MSWE + AI'],
  },
];

export type StackGroup = { label: string; items: string[] };

export const STACK_GROUPS: StackGroup[] = [
  {
    label: 'Software',
    items: [
      'TypeScript',
      'React',
      'Next.js',
      'Node.js',
      'Express',
      'Apollo Server',
      'GraphQL',
      'REST APIs',
      'Python',
      'Django',
      'Flask',
      'FastAPI',
    ],
  },
  {
    label: 'Data',
    items: ['SQL Server', 'PostgreSQL', 'Power BI', 'Apache Superset', 'Spark', 'pandas', 'Redis', 'Supabase'],
  },
  {
    label: 'Automation & DevOps',
    items: ['Docker', 'GitHub Actions', 'Celery', 'Nginx', 'Sentry'],
  },
  {
    label: 'AI / ML',
    items: ['scikit-learn', 'OpenAI', 'Claude', 'RAG', 'CRISP-DM', 'Copilot', 'Codex'],
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
  email: 'lfariabr@gmail.com',
  location: 'Sydney, Australia',
} as const;
