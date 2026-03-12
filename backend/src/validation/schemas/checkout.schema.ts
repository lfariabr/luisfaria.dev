import { z } from 'zod';
import config from '../../config/config';

const isAllowedReturnUrlOrigin = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const allowed = new URL(config.frontendUrl);
    return parsed.origin === allowed.origin;
  } catch {
    return false;
  }
};

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
  returnUrl: z
    .string()
    .url('Invalid return URL')
    .refine(isAllowedReturnUrlOrigin, { message: 'Return URL must match frontend origin' })
    .optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
