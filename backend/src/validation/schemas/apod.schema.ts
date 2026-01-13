import { z } from 'zod';

/**
 * Zod schema for NASA APOD API response validation.
 * Ensures type safety and catches malformed responses early.
 */
export const apodResponseSchema = z.object({
  copyright: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  explanation: z.string().min(1, 'Explanation is required'),
  media_type: z.enum(['image', 'video', 'other']),
  service_version: z.string(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('URL must be valid').optional(),
  hdurl: z.string().url().optional(),
  apod_url: z.string().url(),
});

export type ApodResponse = z.infer<typeof apodResponseSchema>;

/**
 * NASA API error response schema (for 429, 403, etc.)
 */
export const nasaErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type NasaErrorResponse = z.infer<typeof nasaErrorSchema>;
