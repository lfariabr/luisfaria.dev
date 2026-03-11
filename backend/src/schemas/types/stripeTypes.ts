export const stripeTypes = `#graphql
  enum ProductKey {
    coffee
    meeting
  }

  type StripeCheckoutSession {
    sessionId: String!
    url: String!
  }

  type StripeCheckoutSessionStatus {
    sessionId: String!
    paymentStatus: String!
    status: String
  }

  input CheckoutInput {
    productKey: ProductKey!
    email: String
    returnUrl: String
  }

  extend type Mutation {
    createCheckoutSession(input: CheckoutInput!): StripeCheckoutSession!
  }

  extend type Query {
    checkoutSessionStatus(sessionId: String!): StripeCheckoutSessionStatus!
  }
`;
