import type { Metadata } from 'next';
import { resolveOgImage } from '@/lib/seo/metadata';

const ogImage = resolveOgImage();

const description =
  'Case studies by Luis Faria — problem → approach → stack → outcome across data engineering, software, automation, and AI.';

export const metadata: Metadata = {
  title: 'Case Studies | Luis Faria',
  description,
  alternates: { canonical: 'https://luisfaria.dev/work' },
  openGraph: {
    title: 'Case Studies | Luis Faria',
    description,
    url: 'https://luisfaria.dev/work',
    siteName: 'Luis Faria',
    type: 'website',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Luis Faria case studies' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Case Studies | Luis Faria',
    description,
    images: [ogImage],
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
