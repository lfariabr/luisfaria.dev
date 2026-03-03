import { gql } from '@apollo/client';

export const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession($input: CheckoutInput!) {
    createCheckoutSession(input: $input) {
      sessionId
      url
    }
  }
`;
