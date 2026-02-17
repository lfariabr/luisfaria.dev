import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects | Luis Faria',
  description:
    'Portfolio of software engineering projects by Luis Faria — full-stack applications, open-source tools, and technical experiments.',
  alternates: { canonical: 'https://luisfaria.dev/projects' },
  openGraph: {
    title: 'Projects | Luis Faria',
    description:
      'Portfolio of software engineering projects — full-stack applications, open-source tools, and technical experiments.',
    url: 'https://luisfaria.dev/projects',
    siteName: 'Luis Faria',
    type: 'website',
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
