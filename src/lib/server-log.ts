import "server-only";

/** Server-side error log. Never forward raw DB errors to the client. */
export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}

export class DataError extends Error {
  constructor(scope: string, cause: unknown) {
    super(`Failed to load ${scope}`);
    logServerError(scope, cause);
  }
}
