/**
 * Curated impact metrics for the home page. Kept concrete and defensible -
 * every number here should survive a "how did you measure that?" in an interview.
 * Edit here; the MetricsSection renders from this.
 */

export type MetricStat = {
  value: string;
  caption: string;
  /** Public receipt (write-up) for the number; stats without one render unlinked. */
  href?: string;
};
export type MetricGroup = {
  label: string;
  /** Full Tailwind text-color class (literal so the JIT scanner keeps it). */
  accent: string;
  stats: MetricStat[];
};

export const METRIC_GROUPS: MetricGroup[] = [
  {
    label: 'Scale',
    accent: 'text-emerald-500',
    stats: [
      { value: '2,000', caption: 'Parents served by a portal built solo in 8 weeks' },
      {
        value: '1M+',
        caption: 'Client records managed across 20+ clinics',
        href: 'https://dev.to/lfariaus/clinictrends-ai-transforming-customer-feedback-into-intelligent-insights-47en',
      },
      {
        value: '30K+',
        caption: 'WhatsApp messages automated / month',
        href: 'https://dev.to/lfariaus/from-google-sheets-to-a-scalable-saas-building-konquista-with-python-and-django-46mh',
      },
    ],
  },
  {
    label: 'Reliability & security',
    accent: 'text-sky-500',
    stats: [
      { value: '0', caption: 'Cross-account data leaks at 100-concurrent load' },
      { value: 'Passed', caption: 'External OWASP pentest - no breach' },
      { value: '500+', caption: 'Automated tests behind a CI release gate' },
    ],
  },
  {
    label: 'Efficiency',
    accent: 'text-amber-500',
    stats: [
      { value: '100 min → 2 s', caption: 'Batch job runtime after a rewrite' },
      {
        value: '~2 s',
        caption: 'Deploy downtime, down from 10+ minutes',
        href: 'https://dev.to/lfariaus/from-git-pull-to-gitops-how-i-built-a-production-cicd-pipeline-on-a-12-digitalocean-droplet-34gn',
      },
      { value: '11 → 0', caption: 'Manual query edits per finance reporting cycle' },
    ],
  },
  {
    label: 'Building in public',
    accent: 'text-violet-500',
    stats: [
      {
        value: '30+',
        caption: 'Engineering write-ups published on dev.to',
        href: 'https://dev.to/lfariaus',
      },
      {
        value: '1,100+',
        caption: 'Commits on an open-source agentic study pipeline',
        href: 'https://dev.to/lfariaus/12-modules-12-weeks-1-pipeline-studying-a-masters-with-agentic-ai-1ohg',
      },
    ],
  },
];
