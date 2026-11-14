import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveOgImage } from '@/lib/seo/metadata';

const ogImage = resolveOgImage();

export const metadata: Metadata = {
  title: 'AI Assistant | Luis Faria',
  description:
    'Chat with Luis Faria\'s AI assistant to explore engineering experience, projects, and technical expertise.',
  alternates: { canonical: 'https://luisfaria.dev/chatbot' },
  openGraph: {
    title: 'AI Assistant | Luis Faria',
    description:
      'Chat with Luis Faria\'s AI assistant to explore engineering experience and technical expertise.',
    url: 'https://luisfaria.dev/chatbot',
    siteName: 'Luis Faria',
    type: 'website',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Luis Faria AI assistant' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Assistant | Luis Faria',
    description:
      'Chat with Luis Faria\'s AI assistant to explore engineering experience and technical expertise.',
    images: [ogImage],
  },
};

/** The chatbot is hidden for now (#497): the route 404s. Delete the notFound() call to bring it back. */
const CHATBOT_HIDDEN = true;

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  if (CHATBOT_HIDDEN) notFound();
  return children;
}
