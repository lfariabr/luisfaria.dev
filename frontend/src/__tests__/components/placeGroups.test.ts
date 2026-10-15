import { groupPinsByPlace } from '@/components/relationship/placeGroups';
import type { Pin } from '@/lib/graphql/types/pin.types';

let seq = 0;
const pin = (overrides: Partial<Pin>): Pin => {
  seq += 1;
  return {
    id: `pin-${seq}`,
    date: '2026-05-01T00:00:00.000Z',
    placeName: 'Corner Cafe',
    amount: 10,
    lat: -33.87,
    lng: 151.22,
    category: null,
    payment: null,
    city: null,
    countryCode: null,
    notes: null,
    source: null,
    placeId: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
};

describe('groupPinsByPlace', () => {
  it('stacks visits sharing a placeId even when coordinates differ slightly', () => {
    const groups = groupPinsByPlace([
      pin({ placeId: 'place-a', lat: -33.87001 }),
      pin({ placeId: 'place-a', lat: -33.87009, date: '2026-06-01T00:00:00.000Z' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].visits).toHaveLength(2);
  });

  it('stacks visits on identical coordinates without a placeId', () => {
    expect(groupPinsByPlace([pin({}), pin({ placeName: 'Corner Cafe Potts Point' })])).toHaveLength(1);
  });

  it('joins transitively: a hand-placed visit on the spot of a geocoded one', () => {
    const groups = groupPinsByPlace([
      pin({ placeId: 'place-a', lat: -33.8, lng: 151.1 }),
      pin({ placeId: 'place-a', lat: -33.9, lng: 151.2 }),
      pin({ placeId: null, lat: -33.9, lng: 151.2 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].visits).toHaveLength(3);
  });

  it('keeps neighbouring venues apart', () => {
    const groups = groupPinsByPlace([
      pin({ placeId: 'place-a', lat: -33.87341, lng: 151.22371 }),
      pin({ placeId: 'place-b', lat: -33.87392, lng: 151.22313, placeName: 'Harbour Bistro' }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('orders visits newest first and takes name and position from the newest', () => {
    const [group] = groupPinsByPlace([
      pin({ placeId: 'place-a', placeName: 'Old name', date: '2026-02-28T00:00:00.000Z', lat: -33.1 }),
      pin({ placeId: 'place-a', placeName: 'New name', date: '2026-06-21T00:00:00.000Z', lat: -33.2 }),
    ]);
    expect(group.placeName).toBe('New name');
    expect(group.lat).toBe(-33.2);
    expect(group.visits.map((v) => v.placeName)).toEqual(['New name', 'Old name']);
  });

  it('totals only visits with a spend', () => {
    const [group] = groupPinsByPlace([pin({ amount: 42.5 }), pin({ amount: null }), pin({ amount: 18 })]);
    expect(group.totalSpent).toBe(60.5);
  });

  it('orders places by most recent visit', () => {
    const groups = groupPinsByPlace([
      pin({ placeId: 'old', lat: 1, date: '2026-01-01T00:00:00.000Z' }),
      pin({ placeId: 'new', lat: 2, date: '2026-09-01T00:00:00.000Z' }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['new', 'old']);
  });
});
