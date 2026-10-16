import type { Metadata, Viewport } from 'next';
import PlacesPageClient from './PlacesPageClient';

export const metadata: Metadata = {
  title: 'Places | Luis Faria',
  robots: {
    index: false,
    follow: false,
  },
};

// A pinch that misses the map would zoom the page instead. This page only: elsewhere page zoom
// stays, since disabling it costs readers who need it. iOS ignores this; see usePreventPagePinchZoom.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PlacesPage() {
  return <PlacesPageClient />;
}
