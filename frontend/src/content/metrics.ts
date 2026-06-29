/**
 * Curated impact metrics for the home page. Kept concrete and defensible —
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
    label: 'Scale & automation',
    accent: 'text-emerald-500',
    stats: [
      { value: '30K+', caption: 'Messages automated / month' },
      { value: '1M+', caption: 'Client records managed' },
      { value: '20+', caption: 'Clinics onboarded' },
    ],
  },
  {
    label: 'Time & cost saved',
    accent: 'text-sky-500',
    stats: [
      { value: '20+ hrs', caption: 'Saved weekly via ad automation' },
      { value: '8+ hrs', caption: 'Saved weekly with BI dashboards' },
      { value: '50%', caption: 'Email costs reduced' },
    ],
  },
  {
    label: 'Outcomes',
    accent: 'text-amber-500',
    stats: [
      { value: '+15%', caption: 'Marketing ROI improvement' },
      { value: '~4 hrs', caption: 'Saved per term rollover (school reporting)' },
    ],
  },
];
