import Note from '../../models/Note';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { withNotesErrorHandling } from './errorHandler';

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

const defaultTitleForPeriod = (periodType?: 'WEEKLY' | 'MONTHLY') =>
  periodType === 'MONTHLY' ? 'Monthly update' : 'Weekly update';

export const noteMutations = {
  createNote: async (_: unknown, { input }: { input: NoteInput }, context: ResolverContext) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }
    const userId = context.user.id;

    const note = await withNotesErrorHandling(
      () =>
        Note.create({
          ...input,
          title: input.title?.trim() || defaultTitleForPeriod(input.periodType),
          date: input.date ? new Date(input.date) : new Date(),
          userId,
        }),
      'createNote'
    );
    logger.info('Note created', { userId, noteId: note.id, periodType: note.periodType });

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
    const userId = context.user.id;

    const updatePayload: Record<string, unknown> = { ...input };
    if (input.date) {
      updatePayload.date = new Date(input.date);
    }
    if (typeof input.title === 'string') {
      const trimmedTitle = input.title.trim();
      if (trimmedTitle) {
        updatePayload.title = trimmedTitle;
      } else {
        const existingNote = await withNotesErrorHandling(
          () => Note.findOne({ _id: id, userId }).select('periodType'),
          'resolveUpdateNoteTitle'
        );
        updatePayload.title = defaultTitleForPeriod(input.periodType ?? existingNote?.periodType);
      }
    }

    const note = await withNotesErrorHandling(
      () =>
        Note.findOneAndUpdate({ _id: id, userId }, { $set: updatePayload }, { new: true, runValidators: true }),
      'updateNote'
    );

    if (!note) {
      logger.warn('Note update failed: note not found', { userId, noteId: id });
      throw Errors.notFound('Note');
    }
    logger.info('Note updated', { userId, noteId: note.id });

    return note;
  },

  deleteNote: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
    if (!context.user?.id) {
      throw Errors.unauthenticated();
    }
    const userId = context.user.id;

    const result = await withNotesErrorHandling(
      () => Note.findOneAndDelete({ _id: id, userId }),
      'deleteNote'
    );
    if (!result) {
      logger.warn('Note delete failed: note not found', { userId, noteId: id });
      throw Errors.notFound('Note');
    }
    logger.info('Note deleted', { userId, noteId: result.id });
    return true;
  },
};
