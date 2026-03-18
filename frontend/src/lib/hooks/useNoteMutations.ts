import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { CREATE_NOTE, DELETE_NOTE, UPDATE_NOTE } from '../graphql/mutations/note.mutations';
import { Note, NoteInput, NoteUpdateInput } from '../graphql/types/note.types';

export const useNoteMutations = () => {
  const [createNoteMutation, { loading: createLoading }] = useMutation<{ createNote: Note }, { input: NoteInput }>(
    CREATE_NOTE,
    {
    onCompleted: () => toast.success('Note created successfully!'),
    onError: (error) => toast.error(`Failed to create note: ${error.message}`),
    }
  );

  const [updateNoteMutation, { loading: updateLoading }] = useMutation<
    { updateNote: Note },
    { id: string; input: NoteUpdateInput }
  >(UPDATE_NOTE, {
    onCompleted: () => toast.success('Note updated successfully!'),
    onError: (error) => toast.error(`Failed to update note: ${error.message}`),
  });

  const [deleteNoteMutation, { loading: deleteLoading }] = useMutation<{ deleteNote: boolean }, { id: string }>(
    DELETE_NOTE,
    {
    onCompleted: () => toast.success('Note deleted successfully!'),
    onError: (error) => toast.error(`Failed to delete note: ${error.message}`),
    }
  );

  const createNote = async (input: NoteInput): Promise<Note | null> => {
    try {
      const { data } = await createNoteMutation({ variables: { input } });
      return data?.createNote ?? null;
    } catch (error) {
      logger.error('Note mutation failed', { operation: 'create', error: String(error) });
      return null;
    }
  };

  const updateNote = async (id: string, input: NoteUpdateInput): Promise<Note | null> => {
    try {
      const { data } = await updateNoteMutation({ variables: { id, input } });
      return data?.updateNote ?? null;
    } catch (error) {
      logger.error('Note mutation failed', { operation: 'update', error: String(error) });
      return null;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { data } = await deleteNoteMutation({ variables: { id } });
      return Boolean(data?.deleteNote);
    } catch (error) {
      logger.error('Note mutation failed', { operation: 'delete', error: String(error) });
      return false;
    }
  };

  return {
    createNote,
    updateNote,
    deleteNote,
    loading: {
      create: createLoading,
      update: updateLoading,
      delete: deleteLoading,
      any: createLoading || updateLoading || deleteLoading,
    },
  };
};
