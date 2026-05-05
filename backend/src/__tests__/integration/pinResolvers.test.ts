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
  placeName: 'Bistro Rex',
  amount: -145.13,
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
  let userContext: { user: { id: string; email: string; role: UserRole } };

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();

    const hash = await bcrypt.hash('Pass1234!', 10);
    const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: hash, role: UserRole.ADMIN });
    const user = await User.create({ name: 'User', email: 'user@example.com', password: hash, role: UserRole.USER });

    adminContext = { user: { id: getDocId(admin as { _id: unknown }), email: admin.email, role: UserRole.ADMIN } };
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
      expect(pins[0].placeName).toBe('Bistro Rex');
      expect(pins[0].amount).toBe(-145.13);
    });

    it('returns pins sorted by newest date first', async () => {
      await Pin.create([
        { ...PIN_INPUT, placeName: 'Older place', date: new Date('2026-01-10T00:00:00.000Z'), amount: -10 },
        { ...PIN_INPUT, placeName: 'Newer place', date: new Date('2026-03-10T00:00:00.000Z'), amount: -20 },
      ]);

      const response = await executeOperation(PINS_QUERY, {}, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      const pins = (response.body.singleResult.data as unknown as PinsQueryData).pins;
      expect(pins.map((pin) => pin.placeName)).toEqual(['Newer place', 'Older place']);
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
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);
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
      expect(pin.placeName).toBe('Bistro Rex');
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
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);
    });

    it('rejects USER role', async () => {
      const response = await executeOperation(CREATE_PIN_MUTATION, { input: PIN_INPUT }, userContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);

      expect(await Pin.countDocuments()).toBe(0);
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
      expect(response.body.singleResult.errors?.[0].message).toMatch(/not author/i);
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
