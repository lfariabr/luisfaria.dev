import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import { UserRole } from '../../models/User';
import Payment from '../../models/Payment';

interface PaymentsQueryData {
  payments: Array<{
    id: string;
    email: string | null;
    productKey: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

const PAYMENTS_QUERY = `
  query Payments {
    payments {
      id
      email
      productKey
      amount
      currency
      status
      createdAt
    }
  }
`;

const contextFor = (role: UserRole) => ({
  user: { id: '507f1f77bcf86cd799439011', email: `${role.toLowerCase()}@example.com`, role },
});

const getErrorCode = (response: Awaited<ReturnType<typeof executeOperation>>) =>
  response.body.kind === 'single' ? response.body.singleResult.errors?.[0]?.extensions?.code : undefined;

describe('Payment Resolvers', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    await Payment.create([
      {
        email: 'old@example.com',
        productKey: 'coffee',
        amount: 500,
        currency: 'aud',
        status: 'paid',
        stripeSessionId: 'cs_old',
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
      {
        email: 'new@example.com',
        productKey: 'meeting',
        amount: 15000,
        currency: 'aud',
        status: 'refunded',
        stripeSessionId: 'cs_new',
        createdAt: new Date('2026-10-05T00:00:00Z'),
      },
    ]);
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  it('lists Payments newest first for ADMIN', async () => {
    const response = await executeOperation(PAYMENTS_QUERY, {}, contextFor(UserRole.ADMIN));

    expect(response.body.kind).toBe('single');
    if (response.body.kind !== 'single') return;
    expect(response.body.singleResult.errors).toBeUndefined();

    const data = response.body.singleResult.data as unknown as PaymentsQueryData;
    expect(data.payments.map((p) => p.email)).toEqual(['new@example.com', 'old@example.com']);
    expect(data.payments[0]).toMatchObject({
      productKey: 'meeting',
      amount: 15000,
      currency: 'aud',
      status: 'refunded',
      createdAt: '2026-10-05T00:00:00.000Z',
    });
  });

  it.each([UserRole.USER, UserRole.EDITOR])('denies %s', async (role) => {
    const response = await executeOperation(PAYMENTS_QUERY, {}, contextFor(role));
    expect(getErrorCode(response)).toBe('FORBIDDEN');
  });

  it('denies anonymous visitors', async () => {
    const response = await executeOperation(PAYMENTS_QUERY, {}, { user: null });
    expect(getErrorCode(response)).toBe('UNAUTHENTICATED');
  });
});
