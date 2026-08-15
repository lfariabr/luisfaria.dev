import type { Metadata } from 'next';
import RelationshipPageClient from './RelationshipPageClient';

export const metadata: Metadata = {
  title: 'Relationship Map | Luis Faria',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RelationshipPage() {
  return <RelationshipPageClient />;
}
