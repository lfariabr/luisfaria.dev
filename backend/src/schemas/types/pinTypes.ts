export const pinTypes = `#graphql
  type Pin {
    id: ID!
    date: String!
    placeName: String!
    amount: Float!
    lat: Float!
    lng: Float!
    category: String
    payment: String
    city: String
    countryCode: String
    notes: String
    source: String
    createdAt: String!
  }

  input PinInput {
    date: String!
    placeName: String!
    amount: Float!
    lat: Float!
    lng: Float!
    category: String
    payment: String
    city: String
    countryCode: String
    notes: String
    source: String
  }

  type RelationshipHomeLocation {
    label: String!
    lat: Float!
    lng: Float!
  }

  extend type Query {
    pins: [Pin!]!
    relationshipHomeLocation: RelationshipHomeLocation
  }

  extend type Mutation {
    createPin(input: PinInput!): Pin!
  }
`;
