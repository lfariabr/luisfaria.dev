import { gql } from '@apollo/client';

// Fragment for consistent APOD data shape
export const APOD_FRAGMENT = gql`
  fragment ApodFields on Apod {
    date
    title
    explanation
    url
    mediaType
    serviceVersion
    hdurl
    copyright
    apodUrl
  }
`;

// Query to get today's APOD
export const GET_TODAYS_APOD = gql`
  query GetTodaysApod {
    getTodaysApod {
      ...ApodFields
    }
  }
  ${APOD_FRAGMENT}
`;

// Query to get APOD by date
export const GET_APOD_BY_DATE = gql`
  query GetApodByDate($date: String!) {
    getApodByDate(date: $date) {
      ...ApodFields
    }
  }
  ${APOD_FRAGMENT}
`;