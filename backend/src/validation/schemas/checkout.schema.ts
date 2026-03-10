import { z } from 'zod';

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const CheckoutInputSchema = z.object({
  productKey: z.enum(['coffee', 'meeting']),
  email: z
    .string()
    .trim()
    .regex(emailRegex, 'Invalid email format')
    .optional()
    .or(z.literal('')),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
