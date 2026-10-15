import { gql } from '@apollo/client';
import { PIN_FIELDS } from '../queries/pin.queries';

export const CREATE_PIN = gql`
  mutation CreatePin($input: PinInput!) {
    createPin(input: $input) {
      ...PinFields
    }
  }
  ${PIN_FIELDS}
`;

export const UPDATE_PIN = gql`
  mutation UpdatePin($id: ID!, $input: PinUpdateInput!) {
    updatePin(id: $id, input: $input) {
      ...PinFields
    }
  }
  ${PIN_FIELDS}
`;

export const DELETE_PIN = gql`
  mutation DeletePin($id: ID!) {
    deletePin(id: $id)
  }
`;
