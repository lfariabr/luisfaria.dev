export const paymentTypes = `#graphql
  enum PaymentStatus {
    pending
    paid
    failed
    refunded
  }

  type Payment {
    id: ID!
    email: String
    productKey: ProductKey!
    amount: Int!
    currency: String!
    status: PaymentStatus!
    createdAt: String!
  }

  extend type Query {
    payments: [Payment!]!
  }
`;
