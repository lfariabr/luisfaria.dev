export const writingTypes = `#graphql
  """
  A piece of writing published on dev.to (CONTEXT.md: Post).
  """
  type Post {
    title: String!
    url: String!
    "ISO 8601 timestamp from dev.to"
    publishedAt: String!
  }

  extend type Query {
    "The newest Posts from dev.to, newest first (cached for an hour)"
    latestWriting: [Post!]!
  }
`;
