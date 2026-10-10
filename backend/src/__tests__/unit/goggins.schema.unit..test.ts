// backend/src/__tests__/goggins.schema.unit.test.ts
import { screamInputSchema } from '../../validation/schemas/scream.schema';

describe('screamInputSchema', () => {
  it('accepts a valid email and defaults explicitMode=false', () => {
    const parsed = screamInputSchema.parse({ userEmail: 'you@example.com' });
    expect(parsed.explicitMode).toBe(false);
  });
  it('rejects invalid email', () => {
    expect(() => screamInputSchema.parse({ userEmail: 'nope' })).toThrow();
  });
});