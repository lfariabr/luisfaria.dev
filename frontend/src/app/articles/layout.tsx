import { Metadata } from 'next';
import { resolveOgImage } from '@/lib/seo/metadata';

const ogImage = resolveOgImage();

export const metadata: Metadata = {
  title: 'Articles | Luis Faria',
  description:
    'Technical articles on software engineering, web development, system architecture, and modern technologies by Luis Faria.',
  alternates: { canonical: 'https://luisfaria.dev/articles' },
  openGraph: {
    title: 'Articles | Luis Faria',
    description:
      'Technical articles on software engineering, web development, system architecture, and modern technologies.',
    url: 'https://luisfaria.dev/articles',
    siteName: 'Luis Faria',
    type: 'website',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Luis Faria articles' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles | Luis Faria',
    description:
      'Technical articles on software engineering, web development, system architecture, and modern technologies.',
    images: [ogImage],
  },
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
