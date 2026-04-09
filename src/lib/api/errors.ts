export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readMessage(payload: unknown) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isObject(payload)) {
    return null;
  }

  const errorMessage = payload.error;
  if (typeof errorMessage === "string" && errorMessage.trim().length > 0) {
    return errorMessage;
  }

  const message = payload.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return null;
}

export function toApiError(
  status: number,
  payload: unknown,
  fallback = "Request failed",
) {
  const message = readMessage(payload) ?? fallback;
  return new ApiError(message, status, payload);
}

export async function parseErrorResponse(response: Response) {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    try {
      payload = await response.text();
    } catch {
      payload = null;
    }
  }

  return toApiError(response.status, payload);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
