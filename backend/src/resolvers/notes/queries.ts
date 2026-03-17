import Note, { NotePeriodType } from '../../models/Note';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';

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

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
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
    logger.debug('Fetched notes', { userId: context.user.id, count: notes.length, filters: { periodType, year, month, search, tag } });
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
