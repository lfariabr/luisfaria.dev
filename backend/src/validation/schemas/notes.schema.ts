import { z } from 'zod';

const stringArray = z.array(z.string().trim().min(1)).optional();

export const noteInputSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Content is too long'),
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

export type NoteInput = z.infer<typeof noteInputSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
