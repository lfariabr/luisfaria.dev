export interface Pin {
  id: string;
  date: string;
  placeName: string;
  amount: number;
  lat: number;
  lng: number;
  category: string | null;
  payment: string | null;
  city: string | null;
  countryCode: string | null;
  notes: string | null;
  source: string | null;
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
