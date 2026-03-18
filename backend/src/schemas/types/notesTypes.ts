export const notesTypes = `#graphql
  enum NotePeriodType {
    WEEKLY
    MONTHLY
  }

  type Note {
    id: ID!
    userId: ID!
    title: String
    content: String
    date: String!
    periodType: NotePeriodType!
    accomplishments: [String!]!
    nextPlans: [String!]!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  input NoteInput {
    title: String
    content: String
    date: String
    periodType: NotePeriodType
    accomplishments: [String!]
    nextPlans: [String!]
    tags: [String!]
  }

  input NoteUpdateInput {
    title: String
    content: String
    date: String
    periodType: NotePeriodType
    accomplishments: [String!]
    nextPlans: [String!]
    tags: [String!]
  }

  extend type Query {
    myNotes(
      periodType: NotePeriodType
      year: Int
      month: Int
      search: String
      tag: String
      limit: Int = 50
      offset: Int = 0
    ): [Note!]!
    note(id: ID!): Note
  }

  extend type Mutation {
    createNote(input: NoteInput!): Note!
    updateNote(id: ID!, input: NoteUpdateInput!): Note!
    deleteNote(id: ID!): Boolean!
  }
`;
