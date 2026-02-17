import { Metadata } from 'next';

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
  },
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
