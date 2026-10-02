/** Typed API error that route handlers can throw; rendered as JSON. */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, "bad_request", details);
  }
  static unauthorized(message = "Sign in to continue.") {
    return new ApiError(401, message, "unauthorized");
  }
  static forbidden(message = "You do not have access to that.") {
    return new ApiError(403, message, "forbidden");
  }
  static notFound(message = "Not found.") {
    return new ApiError(404, message, "not_found");
  }
  static conflict(message: string) {
    return new ApiError(409, message, "conflict");
  }
  static tooMany(message = "Too many requests. Try again shortly.") {
    return new ApiError(429, message, "rate_limited");
  }
}