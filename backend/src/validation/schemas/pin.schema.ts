import { z } from 'zod';

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:T.+)?$/;

/**
 * True for `YYYY-MM-DD` or a full ISO timestamp whose date part is a real calendar day.
 * `new Date('2026-02-30')` silently becomes 2 March, so the day is checked by round-trip.
 */
export const isCalendarIsoDate = (value: string): boolean => {
  const match = ISO_DATE_PREFIX.exec(value);
  if (!match || Number.isNaN(new Date(value).getTime())) return false;
  const [, year, month, day] = match.map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
};

const isoDateString = z.string().refine(isCalendarIsoDate, 'Date must be a valid ISO date string');

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .min(1, 'Value cannot be empty')
    .max(max, `Value cannot exceed ${max} characters`)
    .optional();

export const pinInputSchema = z.object({
  date: isoDateString,
  placeName: z
    .string()
    .trim()
    .min(1, 'Place name is required')
    .max(160, 'Place name cannot exceed 160 characters'),
  amount: z.number().finite('Amount must be a finite number').positive('Amount must be a positive spend'),
  lat: z.number().finite('Latitude must be a finite number').min(-90).max(90),
  lng: z.number().finite('Longitude must be a finite number').min(-180).max(180),
  category: optionalTrimmedString(80),
  payment: optionalTrimmedString(80),
  city: optionalTrimmedString(80),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'Country code must be ISO 3166-1 alpha-2 (two letters)')
    .optional(),
  notes: optionalTrimmedString(500),
  source: optionalTrimmedString(80),
  placeId: optionalTrimmedString(255),
});

export const pinUpdateSchema = pinInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const pinIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid pin id');

export type PinInput = z.infer<typeof pinInputSchema>;
export type PinUpdateInput = z.infer<typeof pinUpdateSchema>;
