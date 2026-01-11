export const apodTypes = `#graphql
  """
  Astronomy Picture of the Day from NASA API.
  """
  type Apod {
    "Optional copyright holder for the image"
    copyright: String
    "Date of the APOD in YYYY-MM-DD format"
    date: String!
    "Detailed explanation of the image/video"
    explanation: String!
    "Type of media: 'image' or 'video'"
    mediaType: String!
    "NASA API service version"
    serviceVersion: String!
    "Title of the APOD"
    title: String!
    "URL to the standard resolution image/video"
    url: String!
    "URL to the high-definition image (not available for videos)"
    hdurl: String
  }

  extend type Query {
    "Get today's Astronomy Picture of the Day (public)"
    getTodaysApod: Apod!
    "Get APOD for a specific date (requires authentication)"
    getApodByDate(date: String!): Apod!
  }
`;
