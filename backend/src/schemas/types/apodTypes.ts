export const apodTypes = `#graphql
  """
  Astronomy Picture of the Day from NASA API.
  """
  type Apod {
    copyright: String
    date: String!
    explanation: String!
    mediaType: String!
    serviceVersion: String!
    title: String!
    url: String
    hdurl: String
    "Direct link to the APOD page on NASA's website"
    apodUrl: String!
  }

  extend type Query {
    getTodaysApod: Apod!
    getApodByDate(date: String!): Apod!
  }
`;
