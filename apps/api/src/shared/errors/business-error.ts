export abstract class BusinessError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BusinessError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends BusinessError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends BusinessError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}

export class InsufficientStockError extends BusinessError {
  readonly statusCode = 409;
  readonly code = 'INSUFFICIENT_STOCK';

  constructor(message: string) {
    super(message);
  }
}

export class PermissionDeniedError extends BusinessError {
  readonly statusCode = 403;
  readonly code = 'PERMISSION_DENIED';

  constructor(message: string) {
    super(message);
  }
}
