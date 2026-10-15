import type { Metadata } from 'next';
import PlacesPageClient from './PlacesPageClient';

export const metadata: Metadata = {
  title: 'Places | Luis Faria',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlacesPage() {
  return <PlacesPageClient />;
}
