'use client';

import { useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { logger } from '@/lib/logger';

/** What Google knows about a place that we don't store. Fetched live: Google's terms limit caching it. */
export interface PlaceDetails {
  rating?: number;
  ratingCount?: number;
  mapsUrl?: string;
  address?: string;
  photo?: { url: string; author?: { name: string; url?: string } };
}

// Rating and review count are Enterprise-tier Place Details fields and the photo is a billed
// request, so ask once per place per page load. A failure is remembered too, as "no details".
const FIELDS = ['rating', 'userRatingCount', 'googleMapsURI', 'photos', 'shortFormattedAddress'];
const PHOTO_SIZE = { maxWidth: 520, maxHeight: 260 };
const cache = new Map<string, Promise<PlaceDetails | null>>();

async function load(places: google.maps.PlacesLibrary, placeId: string): Promise<PlaceDetails | null> {
  try {
    const place = new places.Place({ id: placeId });
    await place.fetchFields({ fields: FIELDS });
    const photo = place.photos?.[0];
    const author = photo?.authorAttributions[0];
    return {
      rating: place.rating ?? undefined,
      ratingCount: place.userRatingCount ?? undefined,
      mapsUrl: place.googleMapsURI ?? undefined,
      address: place.shortFormattedAddress ?? undefined,
      photo: photo && {
        url: photo.getURI(PHOTO_SIZE),
        author: author && { name: author.displayName, url: author.uri ?? undefined },
      },
    };
  } catch (error) {
    // Hand-placed pins never get here; a geocoded placeId Google no longer knows, a key or a CSP problem can.
    logger.warn('Place details failed', { placeId, error: String(error) });
    return null;
  }
}

/** Google's rating, photo and links for a place, or null until they arrive or when there are none. */
export function usePlaceDetails(placeId?: string | null): PlaceDetails | null {
  const places = useMapsLibrary('places');
  const [loaded, setLoaded] = useState<{ placeId: string; details: PlaceDetails | null } | null>(null);

  useEffect(() => {
    if (!places || !placeId) return;
    let live = true;
    if (!cache.has(placeId)) cache.set(placeId, load(places, placeId));
    void cache.get(placeId)?.then((details) => {
      if (live) setLoaded({ placeId, details });
    });
    return () => {
      live = false;
    };
  }, [places, placeId]);

  return placeId && loaded?.placeId === placeId ? loaded.details : null;
}
