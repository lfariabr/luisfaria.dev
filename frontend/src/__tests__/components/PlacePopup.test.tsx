import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { PlacePopup } from '@/components/relationship/PlacePopup';
import { groupPinsByPlace } from '@/components/relationship/placeGroups';
import { logger } from '@/lib/logger';
import type { Pin } from '@/lib/graphql/types/pin.types';

jest.mock('@vis.gl/react-google-maps', () => ({ useMapsLibrary: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn() } }));

const pin = (overrides: Partial<Pin> = {}): Pin => ({
  id: 'pin-1',
  date: '2026-03-15T00:00:00.000Z',
  placeName: 'Corner Cafe',
  amount: 42.5,
  lat: -33.8717,
  lng: 151.2252,
  category: 'Eat out',
  payment: 'Card',
  city: 'Sydney',
  countryCode: 'AU',
  notes: null,
  source: 'test',
  placeId: null,
  createdAt: '2026-03-15T00:00:00.000Z',
  ...overrides,
});

const fetchFields = jest.fn();
const PlaceCtor = jest.fn();
const googlePlace = {
  rating: 4.6,
  userRatingCount: 1234,
  googleMapsURI: 'https://maps.google.com/?cid=1',
  shortFormattedAddress: '1 Example St, Potts Point',
  photos: [
    {
      getURI: jest.fn(() => 'https://places.example/photo.jpg'),
      authorAttributions: [{ displayName: 'A. Photographer', uri: 'https://maps.google.com/contrib/1' }],
    },
  ],
  fetchFields,
};

const renderPopup = (placeId: string | null) =>
  render(
    <PlacePopup place={groupPinsByPlace([pin({ placeId })])[0]} canEdit={false} amountsHidden={false} onEdit={jest.fn()} />
  );

describe('PlacePopup with Google place details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PlaceCtor.mockImplementation(() => googlePlace);
    fetchFields.mockResolvedValue(undefined);
    (useMapsLibrary as jest.Mock).mockReturnValue({ Place: PlaceCtor });
  });

  it('shows the photo with its author, rating, address and a Maps link', async () => {
    renderPopup('place-a');
    await act(async () => {});

    expect(PlaceCtor).toHaveBeenCalledWith({ id: 'place-a' });
    const photo = screen.getByRole('img', { name: 'Corner Cafe' });
    expect(photo).toHaveAttribute('src', 'https://places.example/photo.jpg');
    expect(photo).toHaveAttribute('referrerpolicy', 'origin'); // the referrer-restricted key needs it
    expect(screen.getByRole('link', { name: 'A. Photographer' })).toHaveAttribute('href', 'https://maps.google.com/contrib/1');
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('(1,234)')).toBeInTheDocument();
    expect(screen.getByText('1 Example St, Potts Point')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /google maps/i })).toHaveAttribute('href', 'https://maps.google.com/?cid=1');
  });

  it('fetches each place once per page session', async () => {
    const { unmount } = renderPopup('place-b');
    await act(async () => {});
    unmount();
    renderPopup('place-b');
    await act(async () => {});

    expect(fetchFields).toHaveBeenCalledTimes(1);
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });

  it('asks Google nothing for a place without a placeId', async () => {
    renderPopup(null);
    await act(async () => {});

    expect(PlaceCtor).not.toHaveBeenCalled();
    expect(screen.getByText('Sydney, AU')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('falls back quietly when Google fails', async () => {
    fetchFields.mockRejectedValue(new Error('PERMISSION_DENIED'));
    renderPopup('place-c');
    await act(async () => {});

    expect(screen.getByText('Sydney, AU')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/error|unavailable/i)).not.toBeInTheDocument();
    expect(logger.warn).toHaveBeenCalledWith('Place details failed', expect.objectContaining({ placeId: 'place-c' }));
  });
});

describe('PlacePopup edit pencil', () => {
  it('is a 44px tap target', () => {
    (useMapsLibrary as jest.Mock).mockReturnValue(null);
    render(<PlacePopup place={groupPinsByPlace([pin()])[0]} canEdit amountsHidden={false} onEdit={jest.fn()} />);

    expect(screen.getByRole('button', { name: /edit corner cafe/i })).toHaveClass('h-11', 'w-11');
  });
});
