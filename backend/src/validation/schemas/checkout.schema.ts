import { z } from 'zod';

export const CheckoutInputSchema = z.object({
  productKey: z.enum(['coffee', 'meeting']),
  email: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().email('Invalid email address').optional()
  ),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
