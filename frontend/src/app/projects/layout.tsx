import { Metadata } from 'next';
import { resolveOgImage } from '@/lib/seo/metadata';

const ogImage = resolveOgImage();

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
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Luis Faria projects' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projects | Luis Faria',
    description:
      'Portfolio of software engineering projects — full-stack applications, open-source tools, and technical experiments.',
    images: [ogImage],
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
