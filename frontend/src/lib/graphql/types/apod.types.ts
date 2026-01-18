// Interfaces for APOD data types

export interface Apod {
  copyright?: string;
  date: string;
  explanation: string;
  mediaType: string;
  serviceVersion: string;
  title: string;
  url?: string;
  hdurl?: string;
  apodUrl: string;
}

export interface ApodsData {
  apods: Apod[];
}

export interface ApodData {
  apod: Apod;
}

export interface ApodVars {
  date: string;
}