import { classifyGeocodeResponse, isEstablishment, type GeocodeResponse } from '../../utils/geocodeClassify';

const establishment: GeocodeResponse = {
  status: 'OK',
  results: [
    {
      formatted_address: 'Corner Cafe, 1 Example St, Sydney NSW 2000, Australia',
      types: ['cafe', 'establishment', 'food', 'point_of_interest'],
      place_id: 'place-corner-cafe',
      geometry: { location: { lat: -33.87, lng: 151.21 } },
    },
  ],
};

const locality: GeocodeResponse = {
  status: 'OK',
  results: [
    {
      formatted_address: 'Sydney NSW, Australia',
      types: ['colloquial_area', 'locality', 'political'],
      place_id: 'place-sydney',
      geometry: { location: { lat: -33.8688, lng: 151.2093 } },
    },
  ],
};

const partialEstablishment: GeocodeResponse = {
  status: 'OK',
  results: [
    {
      formatted_address: 'Harbour Bistro, 2 Wharf Rd, Sydney NSW 2000, Australia',
      types: ['restaurant', 'establishment'],
      partial_match: true,
      geometry: { location: { lat: -33.86, lng: 151.2 } },
    },
  ],
};

const route: GeocodeResponse = {
  status: 'OK',
  results: [
    {
      formatted_address: 'Park Rd, Sydney NSW, Australia',
      types: ['route'],
      geometry: { location: { lat: -33.88, lng: 151.22 } },
    },
  ],
};

describe('classifyGeocodeResponse', () => {
  it('marks an establishment ok and keeps address, types and place id', () => {
    expect(classifyGeocodeResponse(establishment)).toEqual({
      status: 'ok',
      lat: -33.87,
      lng: 151.21,
      placeId: 'place-corner-cafe',
      formattedAddress: 'Corner Cafe, 1 Example St, Sydney NSW 2000, Australia',
      types: ['cafe', 'establishment', 'food', 'point_of_interest'],
      partial: false,
    });
  });

  it('marks a locality CHECK', () => {
    const result = classifyGeocodeResponse(locality);
    expect(result.status).toBe('CHECK');
    expect(result).toMatchObject({ partial: false, reason: expect.stringContaining('not an establishment') });
  });

  it('marks a route CHECK', () => {
    expect(classifyGeocodeResponse(route).status).toBe('CHECK');
  });

  it('marks a partial match CHECK even when it is an establishment', () => {
    expect(classifyGeocodeResponse(partialEstablishment)).toMatchObject({
      status: 'CHECK',
      partial: true,
      reason: 'partial match',
    });
  });

  it('surfaces Google error_message on REQUEST_DENIED', () => {
    const result = classifyGeocodeResponse({
      status: 'REQUEST_DENIED',
      error_message: 'You must enable Billing on the Google Cloud Project.',
      results: [],
    });
    expect(result).toEqual({
      status: 'FAIL',
      message: 'REQUEST_DENIED: You must enable Billing on the Google Cloud Project.',
    });
  });

  it('fails ZERO_RESULTS with the bare status when there is no message', () => {
    expect(classifyGeocodeResponse({ status: 'ZERO_RESULTS', results: [] })).toEqual({
      status: 'FAIL',
      message: 'ZERO_RESULTS',
    });
  });

  it('fails an OK response with no usable location', () => {
    expect(classifyGeocodeResponse({ status: 'OK', results: [] }).status).toBe('FAIL');
    expect(classifyGeocodeResponse({ status: 'OK', results: [{ types: ['cafe'] }] }).status).toBe('FAIL');
  });

  it('fails a response with no status', () => {
    expect(classifyGeocodeResponse({})).toEqual({ status: 'FAIL', message: 'UNKNOWN' });
  });
});

describe('isEstablishment', () => {
  it('accepts any establishment-like type', () => {
    expect(isEstablishment(['bar'])).toBe(true);
    expect(isEstablishment(['point_of_interest'])).toBe(true);
  });

  it('rejects areas, streets and empty types', () => {
    expect(isEstablishment(['locality', 'political'])).toBe(false);
    expect(isEstablishment([])).toBe(false);
  });
});
