import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import Pin from '../../models/Pin';
import config, { parseRelationshipHome } from '../../config/config';
import bcrypt from 'bcryptjs';

const getDocId = (doc: { _id: unknown }) => String(doc._id);

interface PinsQueryData {
  pins: Array<{ id: string; date: string; placeName: string; amount: number; lat: number; lng: number }>;
}

interface CreatePinData {
  createPin: {
    id: string;
    placeName: string;
    amount: number;
    lat: number;
    lng: number;
    city: string | null;
    countryCode: string | null;
  };
}

const PINS_QUERY = `
  query Pins {
    pins {
      id
      date
      placeName
      amount
      lat
      lng
    }
  }
`;

const CREATE_PIN_MUTATION = `
  mutation CreatePin($input: PinInput!) {
    createPin(input: $input) {
      id
      placeName
      amount
      lat
      lng
      city
      countryCode
    }
  }
`;

const PIN_INPUT = {
  date: '2026-01-16T00:00:00.000Z',
  placeName: 'Corner Cafe',
  amount: 42.5,
  lat: -33.8717,
  lng: 151.2252,
  category: 'Eat out',
  payment: 'Amex',
  city: 'Sydney',
  countryCode: 'AU',
  source: 'test',
};

describe('Pin Resolvers', () => {
  let adminContext: { user: { id: string; email: string; role: UserRole } };
  let partnerContext: { user: { id: string; email: string; role: UserRole } };
  let userContext: { user: { id: string; email: string; role: UserRole } };

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();

    const hash = await bcrypt.hash('Pass1234!', 10);
    const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: hash, role: UserRole.ADMIN });
    const partner = await User.create({ name: 'Partner', email: 'partner@example.com', password: hash, role: UserRole.PARTNER });
    const user = await User.create({ name: 'User', email: 'user@example.com', password: hash, role: UserRole.USER });

    adminContext = { user: { id: getDocId(admin as { _id: unknown }), email: admin.email, role: UserRole.ADMIN } };
    partnerContext = { user: { id: getDocId(partner as { _id: unknown }), email: partner.email, role: UserRole.PARTNER } };
    userContext = { user: { id: getDocId(user as { _id: unknown }), email: user.email, role: UserRole.USER } };
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  // ── pins query ────────────────────────────────────────────────────────────────

  describe('pins query', () => {
    it('returns pins for ADMIN', async () => {
      await Pin.create({ ...PIN_INPUT, date: new Date(PIN_INPUT.date) });

      const response = await executeOperation(PINS_QUERY, {}, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const pins = (response.body.singleResult.data as unknown as PinsQueryData).pins;
      expect(pins).toHaveLength(1);
      expect(pins[0].placeName).toBe('Corner Cafe');
      expect(pins[0].amount).toBe(42.5);
    });

    it('returns pins sorted by newest date first', async () => {
      await Pin.create([
        { ...PIN_INPUT, placeName: 'Older place', date: new Date('2026-01-10T00:00:00.000Z'), amount: 10 },
        { ...PIN_INPUT, placeName: 'Newer place', date: new Date('2026-03-10T00:00:00.000Z'), amount: 20 },
      ]);

      const response = await executeOperation(PINS_QUERY, {}, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const pins = (response.body.singleResult.data as unknown as PinsQueryData).pins;
      expect(pins.map((pin) => pin.placeName)).toEqual(['Newer place', 'Older place']);
    });

    it('returns pins for PARTNER', async () => {
      await Pin.create({ ...PIN_INPUT, date: new Date(PIN_INPUT.date) });

      const response = await executeOperation(PINS_QUERY, {}, partnerContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const pins = (response.body.singleResult.data as unknown as PinsQueryData).pins;
      expect(pins).toHaveLength(1);
      expect(pins[0].placeName).toBe('Corner Cafe');
    });

    it('returns empty array when no pins exist', async () => {
      const response = await executeOperation(PINS_QUERY, {}, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      expect((response.body.singleResult.data as unknown as PinsQueryData).pins).toHaveLength(0);
    });

    it('rejects unauthenticated requests', async () => {
      const response = await executeOperation(PINS_QUERY, {}, {});

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not authenticated/i);
    });

    it('rejects USER role', async () => {
      const response = await executeOperation(PINS_QUERY, {}, userContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);
    });
  });

  // ── createPin mutation ────────────────────────────────────────────────────────

  describe('createPin mutation', () => {
    it('creates a pin for ADMIN', async () => {
      const response = await executeOperation(CREATE_PIN_MUTATION, { input: PIN_INPUT }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const pin = (response.body.singleResult.data as unknown as CreatePinData).createPin;
      expect(pin.placeName).toBe('Corner Cafe');
      expect(pin.lat).toBe(-33.8717);
      expect(pin.lng).toBe(151.2252);
      expect(pin.city).toBe('Sydney');
      expect(pin.countryCode).toBe('AU');

      const dbPin = await Pin.findById(pin.id);
      expect(dbPin).not.toBeNull();
    });

    it.each([
      ['empty placeName', { ...PIN_INPUT, placeName: '   ' }],
      ['invalid date', { ...PIN_INPUT, date: 'not-a-date' }],
      ['latitude out of range', { ...PIN_INPUT, lat: 120 }],
      ['longitude out of range', { ...PIN_INPUT, lng: 220 }],
      ['invalid country code', { ...PIN_INPUT, countryCode: 'AUS' }],
      ['negative amount', { ...PIN_INPUT, amount: -5 }],
      ['zero amount', { ...PIN_INPUT, amount: 0 }],
      ['calendar-impossible date', { ...PIN_INPUT, date: '2026-02-30' }],
    ])('rejects invalid input: %s', async (_label, input) => {
      const response = await executeOperation(CREATE_PIN_MUTATION, { input }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(await Pin.countDocuments()).toBe(0);
    });

    it('rejects unauthenticated requests', async () => {
      const response = await executeOperation(CREATE_PIN_MUTATION, { input: PIN_INPUT }, {});

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not authenticated/i);
    });

    it('rejects USER role', async () => {
      const response = await executeOperation(CREATE_PIN_MUTATION, { input: PIN_INPUT }, userContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);

      expect(await Pin.countDocuments()).toBe(0);
    });

    it('creates a pin for PARTNER', async () => {
      const response = await executeOperation(CREATE_PIN_MUTATION, { input: PIN_INPUT }, partnerContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(await Pin.countDocuments()).toBe(1);
    });

    it('stores placeId and allows a second identical visit', async () => {
      const input = { ...PIN_INPUT, placeId: 'ChIJ-test-place' };
      const first = await executeOperation(CREATE_PIN_MUTATION, { input }, adminContext);
      const second = await executeOperation(CREATE_PIN_MUTATION, { input }, partnerContext);

      for (const response of [first, second]) {
        expect(response.body.kind).toBe('single');
        if (response.body.kind !== 'single') return;
        expect(response.body.singleResult.errors).toBeUndefined();
      }
      const stored = await Pin.find({ placeId: 'ChIJ-test-place' });
      expect(stored).toHaveLength(2);
    });
  });

  // ── updatePin mutation ────────────────────────────────────────────────────────

  describe('updatePin mutation', () => {
    const UPDATE_PIN_MUTATION = `
      mutation UpdatePin($id: ID!, $input: PinUpdateInput!) {
        updatePin(id: $id, input: $input) {
          id
          date
          placeName
          amount
          notes
          city
        }
      }
    `;

    interface UpdatePinData {
      updatePin: { id: string; date: string; placeName: string; amount: number; notes: string | null; city: string | null };
    }

    let pinId: string;

    beforeEach(async () => {
      const pin = await Pin.create({ ...PIN_INPUT, date: new Date(PIN_INPUT.date) });
      pinId = getDocId(pin as { _id: unknown });
    });

    it('PARTNER updates only the given fields', async () => {
      const response = await executeOperation(
        UPDATE_PIN_MUTATION,
        { id: pinId, input: { amount: 50, notes: 'anniversary' } },
        partnerContext
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const pin = (response.body.singleResult.data as unknown as UpdatePinData).updatePin;
      expect(pin).toMatchObject({ amount: 50, notes: 'anniversary', placeName: 'Corner Cafe', city: 'Sydney' });
      expect(pin.date).toBe(PIN_INPUT.date);
    });

    it('converts an updated date to a Date', async () => {
      const response = await executeOperation(UPDATE_PIN_MUTATION, { id: pinId, input: { date: '2026-05-03' } }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const stored = await Pin.findById(pinId);
      expect(stored?.date.toISOString()).toBe('2026-05-03T00:00:00.000Z');
    });

    it.each([
      ['empty input', {}],
      ['negative amount', { amount: -1 }],
      ['latitude out of range', { lat: 120 }],
      ['empty placeName', { placeName: '  ' }],
    ])('rejects %s and leaves the pin unchanged', async (_label, input) => {
      const response = await executeOperation(UPDATE_PIN_MUTATION, { id: pinId, input }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      const stored = await Pin.findById(pinId);
      expect(stored?.amount).toBe(42.5);
      expect(stored?.placeName).toBe('Corner Cafe');
    });

    it('returns not found for a missing pin', async () => {
      const response = await executeOperation(
        UPDATE_PIN_MUTATION,
        { id: '0123456789abcdef01234567', input: { amount: 5 } },
        adminContext
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('NOT_FOUND');
    });

    it('rejects a malformed id', async () => {
      const response = await executeOperation(UPDATE_PIN_MUTATION, { id: 'nope', input: { amount: 5 } }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
    });

    it.each([
      ['USER', () => userContext],
      ['anonymous', () => ({})],
    ])('rejects %s', async (_label, context) => {
      const response = await executeOperation(UPDATE_PIN_MUTATION, { id: pinId, input: { amount: 5 } }, context());

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect((await Pin.findById(pinId))?.amount).toBe(42.5);
    });
  });

  // ── deletePin mutation ────────────────────────────────────────────────────────

  describe('deletePin mutation', () => {
    const DELETE_PIN_MUTATION = `
      mutation DeletePin($id: ID!) {
        deletePin(id: $id)
      }
    `;

    let pinId: string;

    beforeEach(async () => {
      const pin = await Pin.create({ ...PIN_INPUT, date: new Date(PIN_INPUT.date) });
      pinId = getDocId(pin as { _id: unknown });
    });

    it('ADMIN deletes the pin', async () => {
      const response = await executeOperation(DELETE_PIN_MUTATION, { id: pinId }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      expect((response.body.singleResult.data as { deletePin: boolean }).deletePin).toBe(true);
      expect(await Pin.findById(pinId)).toBeNull();
    });

    it.each([
      ['PARTNER', () => partnerContext],
      ['USER', () => userContext],
      ['anonymous', () => ({})],
    ])('rejects %s and keeps the pin', async (_label, context) => {
      const response = await executeOperation(DELETE_PIN_MUTATION, { id: pinId }, context());

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(await Pin.findById(pinId)).not.toBeNull();
    });

    it('returns not found for a missing pin', async () => {
      const response = await executeOperation(DELETE_PIN_MUTATION, { id: '0123456789abcdef01234567' }, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('NOT_FOUND');
    });
  });

  // ── relationshipHomeLocation query ────────────────────────────────────────────

  describe('relationshipHomeLocation query', () => {
    const HOME_QUERY = `
      query RelationshipHomeLocation {
        relationshipHomeLocation {
          label
          lat
          lng
        }
      }
    `;

    interface HomeData {
      relationshipHomeLocation: { label: string; lat: number; lng: number } | null;
    }

    let originalHome: typeof config.relationshipHome;

    beforeEach(() => {
      originalHome = config.relationshipHome;
    });

    afterEach(() => {
      config.relationshipHome = originalHome;
    });

    it('returns coordinates for ADMIN when configured', async () => {
      config.relationshipHome = { label: 'Home base', lat: 1.23, lng: 2.34 };

      const response = await executeOperation(HOME_QUERY, {}, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const home = (response.body.singleResult.data as unknown as HomeData).relationshipHomeLocation;
      expect(home).toEqual({ label: 'Home base', lat: 1.23, lng: 2.34 });
    });

    it('returns coordinates for PARTNER when configured', async () => {
      config.relationshipHome = { label: 'Home base', lat: 1.23, lng: 2.34 };

      const response = await executeOperation(HOME_QUERY, {}, partnerContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const home = (response.body.singleResult.data as unknown as HomeData).relationshipHomeLocation;
      expect(home).toEqual({ label: 'Home base', lat: 1.23, lng: 2.34 });
    });

    it('returns null when home env is not configured', async () => {
      config.relationshipHome = null;

      const response = await executeOperation(HOME_QUERY, {}, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      expect((response.body.singleResult.data as unknown as HomeData).relationshipHomeLocation).toBeNull();
    });

    it('rejects unauthenticated requests', async () => {
      config.relationshipHome = { label: 'Home base', lat: 1.23, lng: 2.34 };

      const response = await executeOperation(HOME_QUERY, {}, {});

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not authenticated/i);
    });

    it('rejects USER role', async () => {
      config.relationshipHome = { label: 'Home base', lat: 1.23, lng: 2.34 };

      const response = await executeOperation(HOME_QUERY, {}, userContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);
    });
  });

  // ── parseRelationshipHome (config parser) ─────────────────────────────────────

  describe('parseRelationshipHome', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('returns null when neither var is set', () => {
      expect(parseRelationshipHome({})).toBeNull();
    });

    it('treats whitespace-only values as missing', () => {
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '   ', RELATIONSHIP_HOME_LNG: '\t' })).toBeNull();
    });

    it('trims surrounding whitespace before parsing valid coords', () => {
      expect(
        parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '  1.23  ', RELATIONSHIP_HOME_LNG: '\t2.34\n' })
      ).toEqual({ label: 'Home base', lat: 1.23, lng: 2.34 });
    });

    it('rejects trailing garbage in lat (e.g. "1.23abc")', () => {
      expect(
        parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '1.23abc', RELATIONSHIP_HOME_LNG: '2.34' })
      ).toBeNull();
    });

    it('rejects trailing garbage in lng (e.g. "2.34xyz")', () => {
      expect(
        parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '1.23', RELATIONSHIP_HOME_LNG: '2.34xyz' })
      ).toBeNull();
    });

    it('returns null and warns when only lat is set', () => {
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '1.23' })).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns null and warns when only lng is set', () => {
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LNG: '2.34' })).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns null when lat is non-numeric', () => {
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: 'banana', RELATIONSHIP_HOME_LNG: '2.34' })).toBeNull();
    });

    it('returns null when lat is out of range', () => {
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '999', RELATIONSHIP_HOME_LNG: '2.34' })).toBeNull();
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '-91', RELATIONSHIP_HOME_LNG: '2.34' })).toBeNull();
    });

    it('returns null when lng is out of range', () => {
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '1.23', RELATIONSHIP_HOME_LNG: '500' })).toBeNull();
      expect(parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '1.23', RELATIONSHIP_HOME_LNG: '-181' })).toBeNull();
    });

    it('parses valid coords with default label', () => {
      expect(
        parseRelationshipHome({ RELATIONSHIP_HOME_LAT: '1.23', RELATIONSHIP_HOME_LNG: '2.34' })
      ).toEqual({ label: 'Home base', lat: 1.23, lng: 2.34 });
    });

    it('uses custom label when provided', () => {
      expect(
        parseRelationshipHome({
          RELATIONSHIP_HOME_LAT: '1.23',
          RELATIONSHIP_HOME_LNG: '2.34',
          RELATIONSHIP_HOME_LABEL: 'Casa',
        })
      ).toEqual({ label: 'Casa', lat: 1.23, lng: 2.34 });
    });

    it('falls back to default label when label is whitespace-only', () => {
      const result = parseRelationshipHome({
        RELATIONSHIP_HOME_LAT: '1.23',
        RELATIONSHIP_HOME_LNG: '2.34',
        RELATIONSHIP_HOME_LABEL: '   ',
      });
      expect(result?.label).toBe('Home base');
    });
  });
});
