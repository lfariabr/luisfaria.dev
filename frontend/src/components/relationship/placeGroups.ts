import type { Pin } from '@/lib/graphql/types/pin.types';

/** Every visit to one place, shown as a single marker. */
export interface PlaceGroup {
  key: string;
  /** Name, position and id come from the newest visit, so an edit to it renames the stack. */
  placeName: string;
  lat: number;
  lng: number;
  /** Newest first. */
  visits: Pin[];
  totalSpent: number;
}

// 5 decimals is about 1 m: identical spots join, the café next door does not.
const coordKey = (pin: Pin) => `${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}`;

/**
 * Groups visits to the same place. Two pins join when they share a Google placeId
 * or identical coordinates, transitively: a geocoded visit and a hand-placed visit on
 * the same spot join even though only one has a placeId.
 */
export function groupPinsByPlace(pins: Pin[]): PlaceGroup[] {
  const parent = pins.map((_, index) => index);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };

  const firstByKey = new Map<string, number>();
  pins.forEach((pin, index) => {
    const keys = [`c:${coordKey(pin)}`, ...(pin.placeId ? [`p:${pin.placeId}`] : [])];
    for (const key of keys) {
      const seen = firstByKey.get(key);
      if (seen === undefined) firstByKey.set(key, index);
      else union(index, seen);
    }
  });

  const byRoot = new Map<number, Pin[]>();
  pins.forEach((pin, index) => {
    const root = find(index);
    byRoot.set(root, [...(byRoot.get(root) ?? []), pin]);
  });

  return [...byRoot.values()]
    .map((visits) => {
      const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      const newest = sorted[0];
      return {
        key: newest.placeId ?? coordKey(newest),
        placeName: newest.placeName,
        lat: newest.lat,
        lng: newest.lng,
        visits: sorted,
        totalSpent: sorted.reduce((sum, visit) => sum + Math.abs(visit.amount ?? 0), 0),
      };
    })
    .sort((a, b) => b.visits[0].date.localeCompare(a.visits[0].date));
}
