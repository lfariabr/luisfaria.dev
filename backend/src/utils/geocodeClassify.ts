/**
 * Reads a Google Geocoding API response and decides whether the top result is a
 * trustworthy pin location. Pure, so the importer's --preview and its real run
 * share one rule and tests need no network.
 */

/** The parts of a Geocoding API response the importer reads. */
export interface GeocodeResponse {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    types?: string[];
    partial_match?: boolean;
    place_id?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

export type GeocodeStatus = 'ok' | 'CHECK' | 'FAIL';

export type GeocodeClassification =
  | {
      status: 'ok' | 'CHECK';
      lat: number;
      lng: number;
      placeId?: string;
      formattedAddress: string;
      types: string[];
      partial: boolean;
      /** Why the row is CHECK; absent when ok. */
      reason?: string;
    }
  | { status: 'FAIL'; message: string };

/** A result carrying any of these types names a venue, not just an area or street. */
export const ESTABLISHMENT_TYPES: readonly string[] = [
  'establishment',
  'point_of_interest',
  'food',
  'restaurant',
  'cafe',
  'bar',
];

export function isEstablishment(types: readonly string[]): boolean {
  return types.some((type) => ESTABLISHMENT_TYPES.includes(type));
}

export function classifyGeocodeResponse(response: GeocodeResponse): GeocodeClassification {
  const status = response.status ?? 'UNKNOWN';
  if (status !== 'OK') {
    return {
      status: 'FAIL',
      message: response.error_message ? `${status}: ${response.error_message}` : status,
    };
  }

  const top = response.results?.[0];
  const location = top?.geometry?.location;
  if (!top || typeof location?.lat !== 'number' || typeof location?.lng !== 'number') {
    return { status: 'FAIL', message: 'OK but no usable result' };
  }

  const types = top.types ?? [];
  const partial = top.partial_match === true;
  const reasons = [
    ...(partial ? ['partial match'] : []),
    ...(isEstablishment(types) ? [] : [`not an establishment (${types.join(', ') || 'no types'})`]),
  ];

  return {
    status: reasons.length ? 'CHECK' : 'ok',
    lat: location.lat,
    lng: location.lng,
    ...(top.place_id ? { placeId: top.place_id } : {}),
    formattedAddress: top.formatted_address ?? '',
    types,
    partial,
    ...(reasons.length ? { reason: reasons.join('; ') } : {}),
  };
}
