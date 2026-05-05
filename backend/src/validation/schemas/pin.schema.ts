import { z } from 'zod';

const isoDateString = z.string().refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}, 'Date must be a valid ISO date string');

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
  amount: z.number().finite('Amount must be a finite number'),
  lat: z.number().finite('Latitude must be a finite number').min(-90).max(90),
  lng: z.number().finite('Longitude must be a finite number').min(-180).max(180),
  category: optionalTrimmedString(80),
  payment: optionalTrimmedString(80),
  city: optionalTrimmedString(80),
  countryCode: z
    .string()
    .trim()
    .length(2, 'Country code must be ISO 3166-1 alpha-2 format')
    .toUpperCase()
    .optional(),
  notes: optionalTrimmedString(500),
  source: optionalTrimmedString(80),
});

export type PinInput = z.infer<typeof pinInputSchema>;
