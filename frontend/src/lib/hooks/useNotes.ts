import { useQuery } from '@apollo/client';
import { GET_MY_NOTES } from '../graphql/queries/note.queries';
import { MyNotesData, MyNotesVars } from '../graphql/types/note.types';

export const useNotes = (variables?: MyNotesVars) => {
  const { data, loading, error, refetch } = useQuery<MyNotesData, MyNotesVars>(GET_MY_NOTES, {
    variables: {
      limit: 100,
      offset: 0,
      ...variables,
    },
  });

  return {
    notes: data?.myNotes ?? [],
    loading,
    error: error?.message,
    refetch,
  };
};
