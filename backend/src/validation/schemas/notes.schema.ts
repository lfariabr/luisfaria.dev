import { z } from 'zod';

export const noteIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid note id');

const stringArray = z.array(z.string().trim().min(1)).optional();

export const noteInputSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().min(1).max(5000, 'Content is too long').optional(),
  date: z.string().datetime().optional(),
  periodType: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  accomplishments: stringArray,
  nextPlans: stringArray,
  tags: stringArray,
});

export const noteUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    date: z.string().datetime().optional(),
    periodType: z.enum(['WEEKLY', 'MONTHLY']).optional(),
    accomplishments: stringArray,
    nextPlans: stringArray,
    tags: stringArray,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const noteFiltersSchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  search: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(50).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional(),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
