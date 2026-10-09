import { gql } from '@apollo/client';

export const GET_PAYMENTS = gql`
  query GetPayments {
    payments {
      id
      email
      productKey
      amount
      currency
      status
      createdAt
    }
  }
`;
