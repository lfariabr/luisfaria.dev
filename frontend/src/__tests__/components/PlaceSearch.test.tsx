import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { PlaceSearch } from '@/components/relationship/PlaceSearch';

jest.mock('@vis.gl/react-google-maps', () => ({ useMapsLibrary: jest.fn() }));

const fetchFields = jest.fn();
const fetchAutocompleteSuggestions = jest.fn();

const place = {
  id: 'place-hb',
  displayName: 'Harbour Bistro',
  shortFormattedAddress: '12 Harbour St, Potts Point',
  location: { lat: () => -33.86, lng: () => 151.21 },
  addressComponents: [
    { types: ['locality'], longText: 'Potts Point', shortText: 'Potts Point' },
    { types: ['country'], longText: 'Australia', shortText: 'AU' },
  ],
  fetchFields,
};

const placesLibrary = {
  AutocompleteSessionToken: jest.fn(),
  AutocompleteSuggestion: { fetchAutocompleteSuggestions },
};

describe('PlaceSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useMapsLibrary as jest.Mock).mockReturnValue(placesLibrary);
    fetchFields.mockResolvedValue(undefined);
    fetchAutocompleteSuggestions.mockResolvedValue({
      suggestions: [
        {
          placePrediction: {
            placeId: 'place-hb',
            text: { text: 'Harbour Bistro, Potts Point' },
            mainText: { text: 'Harbour Bistro' },
            secondaryText: { text: 'Potts Point NSW' },
            toPlace: () => place,
          },
        },
      ],
    });
  });

  afterEach(() => jest.useRealTimers());

  it('fills name, address, coordinates, city, country and placeId from a suggestion', async () => {
    const onSelect = jest.fn();
    render(<PlaceSearch onSelect={onSelect} bias={{ lat: -33.87, lng: 151.21 }} />);

    fireEvent.change(screen.getByLabelText('Search for a place'), { target: { value: 'harbour' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(fetchAutocompleteSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ input: 'harbour', locationBias: { lat: -33.87, lng: 151.21 } })
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /harbour bistro/i }));
    });

    // shortFormattedAddress is an Essentials field: displayName already makes this a Pro request.
    expect(fetchFields).toHaveBeenCalledWith({
      fields: ['id', 'displayName', 'location', 'addressComponents', 'shortFormattedAddress'],
    });
    expect(onSelect).toHaveBeenCalledWith({
      placeName: 'Harbour Bistro',
      address: '12 Harbour St, Potts Point',
      lat: -33.86,
      lng: 151.21,
      city: 'Potts Point',
      countryCode: 'AU',
      placeId: 'place-hb',
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not search for a single character', async () => {
    render(<PlaceSearch onSelect={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Search for a place'), { target: { value: 'h' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(fetchAutocompleteSuggestions).not.toHaveBeenCalled();
  });

  it('points to map picking when search fails', async () => {
    fetchAutocompleteSuggestions.mockRejectedValue(new Error('denied'));
    render(<PlaceSearch onSelect={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Search for a place'), { target: { value: 'harbour' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText(/pick the spot on the map instead/i)).toBeInTheDocument();
  });

  it('can take focus straight away, for Change on a picked place', () => {
    render(<PlaceSearch onSelect={jest.fn()} autoFocus />);

    expect(screen.getByLabelText('Search for a place')).toHaveFocus();
  });
});
