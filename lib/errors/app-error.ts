export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required") {
    super("UNAUTHENTICATED", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", 403, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super("VALIDATION_ERROR", 400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", 404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super("CONFLICT", 409, message);
  }
}
