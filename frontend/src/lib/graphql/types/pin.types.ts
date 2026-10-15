export interface Pin {
  id: string;
  date: string;
  placeName: string;
  /** Absent for a place pinned without a spend. */
  amount: number | null;
  lat: number;
  lng: number;
  category: string | null;
  payment: string | null;
  city: string | null;
  countryCode: string | null;
  notes: string | null;
  source: string | null;
  placeId: string | null;
  createdAt: string;
}

export interface PinsData {
  pins: Pin[];
}

export interface RelationshipHomeLocation {
  label: string;
  lat: number;
  lng: number;
}

export interface RelationshipHomeData {
  relationshipHomeLocation: RelationshipHomeLocation | null;
}

export interface PinInput {
  date: string;
  placeName: string;
  amount?: number;
  lat: number;
  lng: number;
  category?: string;
  payment?: string;
  city?: string;
  countryCode?: string;
  notes?: string;
  source?: string;
  placeId?: string;
}

/** Partial update: omitted fields are kept, null clears an optional field. */
export type PinUpdateInput = {
  [K in keyof PinInput]?: PinInput[K] | null;
};
