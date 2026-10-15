import {
  applyPlaceSelection,
  emptyPinFormValues,
  pinToFormValues,
  suggestionsFrom,
  toCreateInput,
  toUpdateInput,
  todayInputValue,
  validatePinForm,
} from '@/components/relationship/pinForm';
import type { Pin } from '@/lib/graphql/types/pin.types';

const pin: Pin = {
  id: 'pin-1',
  date: '2026-04-26T00:00:00.000Z',
  placeName: 'Corner Cafe',
  amount: 42.5,
  lat: -33.87,
  lng: 151.22,
  category: 'Eat out',
  payment: 'Amex',
  city: 'Sydney',
  countryCode: 'AU',
  notes: null,
  source: 'import',
  placeId: 'place-corner',
  createdAt: '2026-04-26T00:00:00.000Z',
};

describe('pinForm', () => {
  it('formats today in local time', () => {
    expect(todayInputValue(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  describe('validatePinForm', () => {
    const valid = { ...emptyPinFormValues('2026-05-03'), placeName: 'Harbour Bistro', lat: -33.8, lng: 151.2 };

    it('accepts a blank amount', () => {
      expect(validatePinForm(valid)).toEqual({});
    });

    it.each(['0', '-4', 'abc'])('rejects amount %s', (amount) => {
      expect(validatePinForm({ ...valid, amount }).amount).toBeDefined();
    });

    it('requires a name, a date and a location', () => {
      expect(Object.keys(validatePinForm(emptyPinFormValues('')))).toEqual(['date', 'placeName', 'location']);
    });
  });

  it('builds a create input without blank fields', () => {
    const input = toCreateInput({ ...emptyPinFormValues('2026-05-03'), placeName: ' Park Kiosk ', lat: 1, lng: 2, notes: 'walk' });
    expect(input).toEqual({ date: '2026-05-03', placeName: 'Park Kiosk', lat: 1, lng: 2, notes: 'walk', source: 'app' });
  });

  describe('toUpdateInput', () => {
    it('is empty when nothing changed', () => {
      expect(toUpdateInput(pin, pinToFormValues(pin))).toEqual({});
    });

    it('sends changed fields and nulls for cleared ones', () => {
      const values = { ...pinToFormValues(pin), amount: '', payment: '', notes: 'anniversary', date: '2026-04-27' };
      expect(toUpdateInput(pin, values)).toEqual({ amount: null, payment: null, notes: 'anniversary', date: '2026-04-27' });
    });

    it('drops the placeId when the spot is re-picked on the map', () => {
      const values = applyPlaceSelection(pinToFormValues(pin), { lat: -33.9, lng: 151.3 });
      expect(toUpdateInput(pin, values)).toEqual({ lat: -33.9, lng: 151.3, placeId: null });
    });
  });

  it('takes name, city and placeId from an autocomplete pick', () => {
    const values = applyPlaceSelection(
      { ...emptyPinFormValues('2026-05-03'), placeName: 'typed' },
      { placeName: 'Harbour Bistro', lat: 1, lng: 2, city: 'Perth', countryCode: 'AU', placeId: 'place-hb' }
    );
    expect(values).toMatchObject({ placeName: 'Harbour Bistro', city: 'Perth', countryCode: 'AU', placeId: 'place-hb' });
  });

  it('suggests values most used first', () => {
    const pins = [pin, { ...pin, id: '2', payment: 'Visa' }, { ...pin, id: '3', payment: 'Visa' }, { ...pin, id: '4', payment: null }];
    expect(suggestionsFrom(pins, 'payment')).toEqual(['Visa', 'Amex']);
  });
});
