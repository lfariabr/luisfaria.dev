import { gql } from '@apollo/client';

export const GET_PINS = gql`
  query GetPins {
    pins {
      id
      date
      placeName
      amount
      lat
      lng
      category
      payment
      city
      countryCode
      notes
      source
      createdAt
    }
  }
`;

export const GET_HOME_LOCATION = gql`
  query GetHomeLocation {
    relationshipHomeLocation {
      label
      lat
      lng
    }
  }
`;
