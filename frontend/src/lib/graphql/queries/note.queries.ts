import { gql } from '@apollo/client';

export const NOTE_FIELDS = gql`
  fragment NoteFields on Note {
    id
    userId
    title
    content
    date
    periodType
    accomplishments
    nextPlans
    tags
    createdAt
    updatedAt
  }
`;

export const GET_MY_NOTES = gql`
  query GetMyNotes(
    $periodType: NotePeriodType
    $year: Int
    $month: Int
    $search: String
    $tag: String
    $limit: Int
    $offset: Int
  ) {
    myNotes(
      periodType: $periodType
      year: $year
      month: $month
      search: $search
      tag: $tag
      limit: $limit
      offset: $offset
    ) {
      ...NoteFields
    }
  }
  ${NOTE_FIELDS}
`;
