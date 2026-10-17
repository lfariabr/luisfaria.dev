import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlaceChip } from '@/components/relationship/PlaceChip';
import { emptyPinFormValues, type PinFormValues } from '@/components/relationship/pinForm';

const values = (overrides: Partial<PinFormValues>): PinFormValues => ({
  ...emptyPinFormValues('2026-05-03'),
  placeName: 'Harbour Bistro',
  lat: -33.87271,
  lng: 151.22444,
  ...overrides,
});

describe('PlaceChip', () => {
  it('shows a Google place as its name and short address, not coordinates', () => {
    render(<PlaceChip values={values({ placeId: 'place-hb', address: '12 Harbour St, Potts Point' })} onChange={jest.fn()} />);

    expect(screen.getByText('Harbour Bistro')).toBeInTheDocument();
    expect(screen.getByText('12 Harbour St, Potts Point')).toBeInTheDocument();
    expect(screen.queryByText(/-33\.87/)).not.toBeInTheDocument();
  });

  it('falls back to city and country when editing a saved pin', () => {
    render(<PlaceChip values={values({ placeId: 'place-hb', city: 'Potts Point', countryCode: 'AU' })} onChange={jest.fn()} />);

    expect(screen.getByText('Potts Point, AU')).toBeInTheDocument();
  });

  it('shows a spot picked on the map with coordinates to 4 places', () => {
    render(<PlaceChip values={values({})} onChange={jest.fn()} />);

    expect(screen.getByText('Pinned on map')).toBeInTheDocument();
    expect(screen.getByText('-33.8727, 151.2244')).toBeInTheDocument();
  });

  it('offers Change', () => {
    const onChange = jest.fn();
    render(<PlaceChip values={values({ placeId: 'place-hb' })} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change place' }));
    expect(onChange).toHaveBeenCalled();
  });
});
