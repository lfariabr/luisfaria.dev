export const screamTypes = `#graphql
  type Scream {
    id: ID!
    text: String!
    userEmail: String!
    modelUsed: String!
    explicitMode: Boolean!
    rateLimitInfo: RateLimitInfo
    createdAt: String!
    isSubscriber: Boolean! # future validation, today everyone starting with True
    # at activateGogginsMode.ts: const isSubscriber = await checkStripeCustomer(email) // or fetch from local User collection
    # subscriptionType: String! # e.g. "weekly", "daily", "monthly", "lifetime", "enterprise"
    # goalsArray: [String]! # future
  }

  input ScreamInput {
    userEmail: String!
    explicitMode: Boolean!
  }

  type RateLimitInfo {
    allowed: Boolean!
    resetIn: Int!
    limit: Int!
    remaining: Int!
  }
`;