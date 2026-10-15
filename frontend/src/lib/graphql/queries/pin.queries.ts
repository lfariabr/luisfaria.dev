import { gql } from '@apollo/client';

export const PIN_FIELDS = gql`
  fragment PinFields on Pin {
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
    placeId
    createdAt
  }
`;

export const GET_PINS = gql`
  query GetPins {
    pins {
      ...PinFields
    }
  }
  ${PIN_FIELDS}
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
