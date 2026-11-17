export type DevtoErrorCode = "DEVTO_API_ERROR" | "VALIDATION_ERROR" | "NETWORK_ERROR" | "TIMEOUT";

export class DevtoServiceError extends Error {
  constructor(
    message: string,
    public readonly code: DevtoErrorCode,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "DevtoServiceError";
  }
}
