import { gql } from '@apollo/client';
import { NOTE_FIELDS } from '../queries/note.queries';

export const CREATE_NOTE = gql`
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      ...NoteFields
    }
  }
  ${NOTE_FIELDS}
`;

export const UPDATE_NOTE = gql`
  mutation UpdateNote($id: ID!, $input: NoteUpdateInput!) {
    updateNote(id: $id, input: $input) {
      ...NoteFields
    }
  }
  ${NOTE_FIELDS}
`;

export const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`;
