import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work | Luis Faria',
  description:
    'Featured projects and technical writing by Luis Faria across full-stack engineering, system design, and delivery leadership.',
  alternates: { canonical: 'https://luisfaria.dev/work' },
  openGraph: {
    title: 'Work | Luis Faria',
    description:
      'Featured projects and technical writing by Luis Faria across full-stack engineering and system design.',
    url: 'https://luisfaria.dev/work',
    siteName: 'Luis Faria',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Work | Luis Faria',
    description:
      'Featured projects and technical writing by Luis Faria across full-stack engineering and system design.',
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
