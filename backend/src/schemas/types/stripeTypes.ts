export const stripeTypes = `#graphql
  type StripeCheckoutSession {
    sessionId: String!
    url: String!
  }

  type StripeCheckoutSessionStatus {
    sessionId: String!
    paymentStatus: String!
    status: String
    customerEmail: String
  }

  input CheckoutInput {
    productKey: String!
    email: String
  }

  extend type Mutation {
    createCheckoutSession(input: CheckoutInput!): StripeCheckoutSession!
  }

  extend type Query {
    checkoutSessionStatus(sessionId: String!): StripeCheckoutSessionStatus!
  }
`;
