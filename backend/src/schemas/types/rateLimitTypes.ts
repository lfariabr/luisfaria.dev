export const rateLimitTypes = `#graphql
  type RateLimitInfo {
    limit: Int!
    remaining: Int!
    resetTime: String!
  }
`;
