/**
 * Curated impact metrics for the home page. Kept concrete and defensible -
 * every number here should survive a "how did you measure that?" in an interview.
 * Edit here; the MetricsSection renders from this.
 */

export type MetricStat = { value: string; caption: string };
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
      { value: '1M+', caption: 'Client records managed across 20+ clinics' },
      { value: '30K+', caption: 'WhatsApp messages automated / month' },
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
      { value: '~2 s', caption: 'Deploy downtime, down from 10+ minutes' },
      { value: '11 → 0', caption: 'Manual query edits per finance reporting cycle' },
    ],
  },
];
