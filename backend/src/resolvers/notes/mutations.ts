import Note from '../../models/Note';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';

interface ResolverContext {
  user?: {
    id: string;
  } | null;
}

interface NoteInput {
  title?: string;
  content: string;
  date?: string;
  periodType?: 'WEEKLY' | 'MONTHLY';
  accomplishments?: string[];
  nextPlans?: string[];
  tags?: string[];
}

interface NoteUpdateInput {
  title?: string;
  content?: string;
  date?: string;
  periodType?: 'WEEKLY' | 'MONTHLY';
  accomplishments?: string[];
  nextPlans?: string[];
  tags?: string[];
}

export const noteMutations = {
  createNote: async (_: unknown, { input }: { input: NoteInput }, context: ResolverContext) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }

    const note = await Note.create({
      ...input,
      title: input.title?.trim() || 'Weekly update',
      date: input.date ? new Date(input.date) : new Date(),
      userId: context.user.id,
    });
    logger.info('Note created', { userId: context.user.id, noteId: note.id, periodType: note.periodType });

    return note;
  },

  updateNote: async (
    _: unknown,
    { id, input }: { id: string; input: NoteUpdateInput },
    context: ResolverContext
  ) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }

    const updatePayload: Record<string, unknown> = { ...input };
    if (input.date) {
      updatePayload.date = new Date(input.date);
    }
    if (typeof input.title === 'string') {
      updatePayload.title = input.title.trim() || 'Weekly update';
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: context.user.id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!note) {
      logger.warn('Note update failed: note not found', { userId: context.user.id, noteId: id });
      throw Errors.notFound('Note');
    }
    logger.info('Note updated', { userId: context.user.id, noteId: note.id });

    return note;
  },

  deleteNote: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }

    const result = await Note.findOneAndDelete({ _id: id, userId: context.user.id });
    if (!result) {
      logger.warn('Note delete failed: note not found', { userId: context.user.id, noteId: id });
      throw Errors.notFound('Note');
    }
    logger.info('Note deleted', { userId: context.user.id, noteId: result.id });
    return true;
  },
};
