import { gql } from '@apollo/client';

export const ACTIVATE_GOGGINS_MODE = gql`
  mutation ActivateGogginsMode($input: ScreamInput!) {
    activateGogginsMode(input: $input) {
      id
      text
      userEmail
      modelUsed
      explicitMode
      isSubscriber
      createdAt
      rateLimitInfo {
        limit
        remaining
        resetTime
      }
    }
  }
`;
