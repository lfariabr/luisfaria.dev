import type { Metadata } from 'next';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Assistant | Luis Faria',
    description:
      'Chat with Luis Faria\'s AI assistant to explore engineering experience and technical expertise.',
  },
};

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
