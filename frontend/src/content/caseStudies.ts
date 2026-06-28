/**
 * Curated case studies (problem → approach → stack → outcome).
 * Rendered by /work (index) and /work/[slug] (detail). Edit copy here.
 *
 * NOTE: St Catherine's is kept at a capabilities + tools level — no sensitive
 * data, names, or figures. Replace the bracketed placeholders with real metrics
 * you're comfortable publishing.
 */

export type CaseStudy = {
  slug: string;
  title: string;
  tagline: string;
  context: string;
  period: string;
  /** Pillar labels — Software · Data · Automation · AI/ML. */
  pillars: string[];
  problem: string;
  approach: string[];
  stack: string[];
  outcomes: string[];
  links?: { label: string; href: string }[];
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'st-catherines-data-systems',
    title: 'Data systems for a school',
    tagline: 'Turning fragmented, manual reporting into reliable, decision-ready data.',
    context: 'St Catherine’s School, Sydney · Data Analyst / Engineer',
    period: '2026 – present',
    pillars: ['Data', 'Automation'],
    problem:
      'Reporting relied on manual, fragmented spreadsheets — numbers lived across separate systems, were slow to produce, and were hard to trust. Staff needed dependable figures to make decisions, in a regulated educational environment where accuracy and privacy are non-negotiable.',
    approach: [
      'Built SQL Server data pipelines to consolidate sources into clean, modelled reporting datasets.',
      'Designed Power BI dashboards so staff can self-serve the numbers instead of waiting on manual pulls.',
      'Automated recurring reports to remove repetitive spreadsheet work and reduce human error.',
      'Kept everything inside the school’s governance boundaries — least access, no sensitive data leaving the system.',
    ],
    stack: ['SQL Server', 'T-SQL', 'Power BI', 'ETL / data modeling'],
    outcomes: [
      'Reliable, decision-ready reporting that staff can trust.',
      'Less manual spreadsheet work and faster turnaround on recurring reports.',
      '[Add a concrete result you’re comfortable sharing — e.g. “X hours/week saved on reporting”.]',
    ],
  },
  {
    slug: 'aws-cloud-architecture',
    title: 'Secure cloud architecture for a delivery startup',
    tagline: 'Designing a scalable, defense-in-depth AWS architecture for a 10× surge.',
    context: 'Master of SWE & AI · Cloud Computing Fundamentals',
    period: '2026',
    pillars: ['Software', 'Data'],
    problem:
      'A design brief: propose a secure, scalable cloud architecture for a delivery and payments startup that absorbed a 10× customer surge in a single month without adding headcount. No recipe given — just requirements and a blank canvas.',
    approach: [
      'Route 53 for DNS — the front door to everything.',
      'Elastic Load Balancer distributing traffic with health checks before requests hit compute.',
      'EC2 + Auto Scaling for horizontally scalable compute that absorbs spikes without manual intervention.',
      'S3 for assets/backups, RDS for managed relational data, Lambda for event-driven flows (order/payment notifications).',
      'Security at every layer: IAM least-privilege, MFA, encryption at rest and in transit, security groups.',
    ],
    stack: ['AWS', 'Route 53', 'ELB', 'EC2 + Auto Scaling', 'S3', 'RDS', 'Lambda', 'IAM'],
    outcomes: [
      'A layered architecture justified end-to-end against the brief, scaling to a 10× surge.',
      'Defense-in-depth security as a cascade of decisions from DNS down to the database — not a single switch.',
      'The same patterns map directly onto the production systems I work with every week.',
    ],
    links: [{ label: 'Master’s repo', href: 'https://github.com/lfariabr/masters-swe-ai' }],
  },
  {
    slug: 'apache-superset-bi',
    title: 'Self-hosted BI with Apache Superset',
    tagline: 'Deploying open-source BI end-to-end on two clouds — and learning where deployments actually break.',
    context: 'Master of SWE & AI · Cloud Computing (Assessment 3)',
    period: '2026',
    pillars: ['Data', 'Automation'],
    problem:
      'Deploy an open-source BI platform end-to-end on cloud infrastructure and prove it’s production-usable — more than a login screen — with real data, dashboards, and role-based access.',
    approach: [
      'Provisioned on Azure: Resource Group, VNet + subnet, Network Security Group, Ubuntu VM, Docker Compose (Superset + PostgreSQL + Redis).',
      'Locked the NSG down: opened port 8088 intentionally, kept SSH on 22 restricted to my IP, denied everything else inbound.',
      'Proved it was real: uploaded CSVs, built a working dashboard, configured Admin / Alpha / Gamma RBAC roles.',
      'Repeated the stack on AWS EC2 and worked through the differences (dnf vs apt, Docker Compose not bundled, 8088 over an SSH tunnel).',
    ],
    stack: ['Apache Superset', 'Azure', 'AWS EC2', 'Docker Compose', 'PostgreSQL', 'Redis', 'NSG / networking'],
    outcomes: [
      'A working BI deployment with dashboards and RBAC, reproduced on two different clouds.',
      'Hard-won deployment-friction lessons: architecture diagrams show intent — deployment shows what you actually understand.',
    ],
    links: [{ label: 'Master’s repo', href: 'https://github.com/lfariabr/masters-swe-ai' }],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
