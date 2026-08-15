/**
 * Curated case studies (problem → approach → stack → outcome).
 * Rendered by /work (index) and /work/[slug] (detail). Edit copy here.
 *
 * NOTE: St Catherine's is kept at a capabilities + tools level - no sensitive
 * data, names, or figures. Replace the bracketed placeholders with real metrics
 * you're comfortable publishing.
 */

export type CaseStudy = {
  slug: string;
  title: string;
  tagline: string;
  context: string;
  period: string;
  /** Pillar labels - Software · Data · Automation · AI/ML. */
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
    title: 'Secure education data systems',
    tagline: 'Building student, parent, support, and academic reporting systems with privacy boundaries first.',
    context: 'St Catherine’s School, Sydney · Data & Systems Specialist',
    period: '2026 – present',
    pillars: ['Software', 'Data', 'Automation'],
    problem:
      'School operations depend on data spread across student systems, support workflows, portals, spreadsheets, and reporting exports. The public-safe challenge: make the data useful without weakening privacy, authorization, or governance boundaries.',
    approach: [
      'Built and supported Next.js products for parent/student-facing workflows with server-side authorization and mock-data demo boundaries.',
      'Modernised SQL Server academic reporting paths with source-controlled scripts, provenance, validation gates, and rollback.',
      'Delivered support and portal tooling around Microsoft Graph, FreshService, Schoolbox, Power BI, and SQL Server.',
      'Kept public artifacts sanitized: no live student rows, hostnames, credentials, screenshots, or internal-only identifiers.',
    ],
    stack: ['Next.js', 'TypeScript', 'SQL Server', 'T-SQL', 'Power BI', 'Microsoft Graph', 'FreshService'],
    outcomes: [
      'A 2,000-parent portal shipped solo in 8 weeks and passed external OWASP penetration testing with no breach.',
      '41,601 academic rows validated end-to-end through the Student360 identity bridge with zero unbridged records.',
      'Modern academic exports can be produced in minutes from the source-controlled path while legacy SSIS remains available as rollback.',
    ],
    links: [
      {
        label: 'Parent portal write-up',
        href: 'https://dev.to/lfariaus/2000-parents-1-rule-0-leaks-a-pentested-school-parent-portal-in-8-weeks-2bp8',
      },
    ],
  },
  {
    slug: 'review-pulse-v3',
    title: 'ReviewPulse v3 - inspectable sentiment lab',
    tagline: 'Turning a binary classifier into an aspect-based NLP lab with token-level evidence and deployment trade-offs.',
    context: 'Master of SWE & AI · Intelligent Systems + Deep Learning',
    period: '2026',
    pillars: ['AI/ML', 'Data'],
    problem:
      'Review-level sentiment hides mixed opinions. A sentence can praise food and criticize service, but a binary classifier collapses that into one label. The work needed aspect conditioning, honest evaluation, and an interface that exposed failures instead of hiding them.',
    approach: [
      'Started with ~8,000 Amazon reviews, then rebuilt the product around SemEval-2014 Restaurants aspect annotations.',
      'Compared review-only baselines against aspect-conditioned ATAE-LSTM and DistilBERT sentence-pair models.',
      'Added mixed-polarity subset evaluation, confusion matrices, artifact provenance, Streamlit comparison mode, and gold-label examples.',
      'Exposed attention/attribution as indicative token-level evidence without pretending it was causal reasoning.',
    ],
    stack: ['Python', 'scikit-learn', 'PyTorch', 'Transformers', 'pandas', 'Streamlit'],
    outcomes: [
      '200+ public commits, 363 passing tests, six versioned inference artifacts, and a deployed Streamlit app.',
      'Canonical DistilBERT run reached 0.7199 full-test macro-F1 and 0.6427 mixed-polarity macro-F1.',
      'The UI makes model disagreement, gold-label mismatch, and artifact-size trade-offs visible.',
    ],
    links: [
      { label: 'ReviewPulse repo', href: 'https://github.com/lfariabr/review-pulse' },
      { label: 'Master’s repo', href: 'https://github.com/lfariabr/masters-swe-ai' },
    ],
  },
  {
    slug: 'sommelier-api-mlops',
    title: 'Sommelier API - model governance beyond the notebook',
    tagline: 'A wine-quality ML service where assessment evidence, artifact contracts, and production behavior stay aligned.',
    context: 'Master of SWE & AI · Machine Learning',
    period: '2026',
    pillars: ['AI/ML', 'Software'],
    problem:
      'The assessment notebook moved from a Decision Tree to a class-weighted Random Forest, but production still served the old classifier. The API was not broken; the evidence contract between coursework and deployment was.',
    approach: [
      'Compared 22 model/treatment runs plus a majority baseline across untreated, SMOTE, and class-weighted variants.',
      'Selected the classifier through predeclared gates for ROC-AUC, sensitivity, specificity, balanced accuracy, and interpretability tie-breaks.',
      'Recorded model artifact contracts: source commits, hashes, feature order, target semantics, split parameters, and metrics.',
      'Updated the FastAPI and Streamlit surfaces so clients could consume the changed model without silent contract drift.',
    ],
    stack: ['Python', 'FastAPI', 'scikit-learn', 'pandas', 'Streamlit', 'joblib'],
    outcomes: [
      'Replaced the production classifier with a documented class-weighted Random Forest rather than a notebook-only claim.',
      'Improved held-out ROC-AUC from 0.7923 to 0.8337 and specificity from 0.7252 to 0.8063, while documenting the sensitivity trade-off.',
      'Turned reproducibility, artifact size, and model-selection evidence into first-class engineering concerns.',
    ],
    links: [
      { label: 'Sommelier repo', href: 'https://github.com/lfariabr/sommelier-api' },
      { label: 'Sommelier app', href: 'https://sommelier-api.streamlit.app/' },
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
      'A design brief: propose a secure, scalable cloud architecture for a delivery and payments startup that absorbed a 10× customer surge in a single month without adding headcount. No recipe given - just requirements and a blank canvas.',
    approach: [
      'Route 53 for DNS - the front door to everything.',
      'Elastic Load Balancer distributing traffic with health checks before requests hit compute.',
      'EC2 + Auto Scaling for horizontally scalable compute that absorbs spikes without manual intervention.',
      'S3 for assets/backups, RDS for managed relational data, Lambda for event-driven flows (order/payment notifications).',
      'Security at every layer: IAM least-privilege, MFA, encryption at rest and in transit, security groups.',
    ],
    stack: ['AWS', 'Route 53', 'ELB', 'EC2 + Auto Scaling', 'S3', 'RDS', 'Lambda', 'IAM'],
    outcomes: [
      'A layered architecture justified end-to-end against the brief, scaling to a 10× surge.',
      'Defense-in-depth security as a cascade of decisions from DNS down to the database - not a single switch.',
      'The same patterns map directly onto the production systems I work with every week.',
    ],
    links: [{ label: 'Master’s repo', href: 'https://github.com/lfariabr/masters-swe-ai' }],
  },
  {
    slug: 'apache-superset-bi',
    title: 'Self-hosted BI with Apache Superset',
    tagline: 'Deploying open-source BI end-to-end on two clouds - and learning where deployments actually break.',
    context: 'Master of SWE & AI · Cloud Computing (Assessment 3)',
    period: '2026',
    pillars: ['Data', 'Automation'],
    problem:
      'Deploy an open-source BI platform end-to-end on cloud infrastructure and prove it’s production-usable - more than a login screen - with real data, dashboards, and role-based access.',
    approach: [
      'Provisioned on Azure: Resource Group, VNet + subnet, Network Security Group, Ubuntu VM, Docker Compose (Superset + PostgreSQL + Redis).',
      'Locked the NSG down: opened port 8088 intentionally, kept SSH on 22 restricted to my IP, denied everything else inbound.',
      'Proved it was real: uploaded CSVs, built a working dashboard, configured Admin / Alpha / Gamma RBAC roles.',
      'Repeated the stack on AWS EC2 and worked through the differences (dnf vs apt, Docker Compose not bundled, 8088 over an SSH tunnel).',
    ],
    stack: ['Apache Superset', 'Azure', 'AWS EC2', 'Docker Compose', 'PostgreSQL', 'Redis', 'NSG / networking'],
    outcomes: [
      'A working BI deployment with dashboards and RBAC, reproduced on two different clouds.',
      'Hard-won deployment-friction lessons: architecture diagrams show intent - deployment shows what you actually understand.',
    ],
    links: [{ label: 'Master’s repo', href: 'https://github.com/lfariabr/masters-swe-ai' }],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
