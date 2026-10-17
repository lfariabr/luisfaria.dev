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
// resizes-content makes Android Chrome shrink the page for the keyboard, so the add-place sheet
// fits above it. iOS ignores that too; see useKeyboardInset.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export default function PlacesPage() {
  return <PlacesPageClient />;
}
