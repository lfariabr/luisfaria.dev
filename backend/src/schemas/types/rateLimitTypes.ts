export const rateLimitTypes = `#graphql
  type RateLimitInfo {
    limit: Int!
    remaining: Int!
    resetTime: String!
    allowed: Boolean @deprecated(reason: "Over-limit is the RATE_LIMITED error; removed in #340")
    resetIn: Int @deprecated(reason: "Use resetTime; removed in #340")
  }
`;
