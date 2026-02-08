export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export class ExtendedError extends Error {
  code?: string;
}
