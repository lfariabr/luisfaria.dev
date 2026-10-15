import type { Pin, PinInput, PinUpdateInput } from '@/lib/graphql/types/pin.types';

/** What the add/edit form holds. Text fields stay strings until submit. */
export interface PinFormValues {
  date: string; // YYYY-MM-DD
  placeName: string;
  amount: string; // blank = no spend
  category: string;
  payment: string;
  notes: string;
  lat: number | null;
  lng: number | null;
  city: string;
  countryCode: string;
  placeId: string;
}

/** A place chosen from Autocomplete or tapped on the map. */
export interface PlaceSelection {
  placeName?: string;
  lat: number;
  lng: number;
  city?: string;
  countryCode?: string;
  placeId?: string;
}

export type PinFormErrors = Partial<Record<'date' | 'placeName' | 'amount' | 'location', string>>;

const pad = (value: number) => String(value).padStart(2, '0');

/** Today in the viewer's timezone, as the date input wants it. */
export const todayInputValue = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const emptyPinFormValues = (today = todayInputValue()): PinFormValues => ({
  date: today,
  placeName: '',
  amount: '',
  category: '',
  payment: '',
  notes: '',
  lat: null,
  lng: null,
  city: '',
  countryCode: '',
  placeId: '',
});

export const pinToFormValues = (pin: Pin): PinFormValues => ({
  date: pin.date.slice(0, 10),
  placeName: pin.placeName,
  amount: pin.amount == null ? '' : String(pin.amount),
  category: pin.category ?? '',
  payment: pin.payment ?? '',
  notes: pin.notes ?? '',
  lat: pin.lat,
  lng: pin.lng,
  city: pin.city ?? '',
  countryCode: pin.countryCode ?? '',
  placeId: pin.placeId ?? '',
});

/**
 * Apply a picked place. Autocomplete brings its own name and placeId; a map tap
 * brings neither, so the typed name stays and any old placeId is dropped.
 */
export const applyPlaceSelection = (values: PinFormValues, place: PlaceSelection): PinFormValues => ({
  ...values,
  placeName: place.placeName ?? values.placeName,
  lat: place.lat,
  lng: place.lng,
  city: place.city ?? (place.placeId ? '' : values.city),
  countryCode: place.countryCode ?? (place.placeId ? '' : values.countryCode),
  placeId: place.placeId ?? '',
});

const parseAmount = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : Number(trimmed);
};

export const validatePinForm = (values: PinFormValues): PinFormErrors => {
  const errors: PinFormErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = 'Pick a date';
  if (!values.placeName.trim()) errors.placeName = 'Name the place';
  const amount = parseAmount(values.amount);
  if (amount !== undefined && !(Number.isFinite(amount) && amount > 0)) {
    errors.amount = 'Amount must be more than 0, or leave it blank';
  }
  if (values.lat === null || values.lng === null) errors.location = 'Search for the place or pick it on the map';
  return errors;
};

const optional = (value: string) => value.trim() || undefined;

export const toCreateInput = (values: PinFormValues): PinInput => {
  if (values.lat === null || values.lng === null) throw new Error('Location is required');
  const input: PinInput = {
    date: values.date,
    placeName: values.placeName.trim(),
    lat: values.lat,
    lng: values.lng,
    source: 'app',
  };
  const amount = parseAmount(values.amount);
  if (amount !== undefined) input.amount = amount;
  const text = {
    category: optional(values.category),
    payment: optional(values.payment),
    notes: optional(values.notes),
    city: optional(values.city),
    countryCode: optional(values.countryCode),
    placeId: optional(values.placeId),
  };
  for (const [key, value] of Object.entries(text)) {
    if (value !== undefined) input[key as keyof typeof text] = value;
  }
  return input;
};

/** Only the fields that changed; a cleared optional field becomes null. */
export const toUpdateInput = (original: Pin, values: PinFormValues): PinUpdateInput => {
  const next = toCreateInput(values);
  const before = toCreateInput(pinToFormValues(original));
  const update: PinUpdateInput = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(next)]) as Set<keyof PinInput>;
  keys.delete('source');
  for (const key of keys) {
    if (before[key] === next[key]) continue;
    (update as Record<string, unknown>)[key] = next[key] ?? null;
  }
  return update;
};

/** Distinct non-empty values, most used first, for the datalist suggestions. */
export const suggestionsFrom = (pins: Pin[], field: 'category' | 'payment'): string[] => {
  const counts = new Map<string, number>();
  for (const pin of pins) {
    const value = pin[field]?.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value);
};
