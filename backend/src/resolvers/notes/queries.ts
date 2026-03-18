import Note, { NotePeriodType } from '../../models/Note';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { z } from 'zod';

interface NotesFilterArgs {
  periodType?: NotePeriodType;
  year?: number;
  month?: number;
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

interface ResolverContext {
  user?: {
    id: string;
  } | null;
}

const noteSearchSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .transform((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

export const noteQueries = {
  myNotes: async (_: unknown, args: NotesFilterArgs, context: ResolverContext) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }

    const { periodType, year, month, search, tag, limit = 50, offset = 0 } = args;
    const query: Record<string, unknown> = {
      userId: context.user.id,
    };

    if (periodType) {
      query.periodType = periodType;
    }

    const escapedSearch = search ? noteSearchSchema.safeParse(search) : null;
    if (escapedSearch?.success) {
      query.$or = [
        { title: { $regex: escapedSearch.data, $options: 'i' } },
        { content: { $regex: escapedSearch.data, $options: 'i' } },
      ];
    }

    if (tag?.trim()) {
      query.tags = tag.trim();
    }

    if (year) {
      const safeMonth = month && month >= 1 && month <= 12 ? month : 1;
      const endMonth = month && month >= 1 && month <= 12 ? month : 12;
      const start = new Date(Date.UTC(year, safeMonth - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, endMonth, 1, 0, 0, 0, 0));
      query.date = { $gte: start, $lt: end };
    }

    const notes = await Note.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(Math.max(offset, 0))
      .limit(Math.max(Math.min(limit, 200), 1));
    logger.debug('Fetched notes', {
      userId: context.user.id,
      count: notes.length,
      filters: {
        periodType,
        year,
        month,
        hasSearch: Boolean(search?.trim()),
        hasTag: Boolean(tag?.trim()),
      },
    });
    return notes;
  },

  note: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }

    const note = await Note.findOne({ _id: id, userId: context.user.id });
    if (!note) {
      logger.warn('Note fetch failed: note not found', { userId: context.user.id, noteId: id });
      throw Errors.notFound('Note');
    }
    return note;
  },
};
