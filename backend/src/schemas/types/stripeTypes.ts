export const stripeTypes = `#graphql
  type StripeCheckoutSession {
    sessionId: String!
    url: String!
  }

  input CheckoutInput {
    productKey: String!
    email: String
  }

  extend type Mutation {
    createCheckoutSession(input: CheckoutInput!): StripeCheckoutSession!
  }
`;
