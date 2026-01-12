export type ApodErrorCode =
  | "RATE_LIMITED"
  | "NASA_API_ERROR"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT";

export class ApodServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ApodErrorCode,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApodServiceError";
  }
}