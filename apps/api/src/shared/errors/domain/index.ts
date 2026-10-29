export class OrganizationAlreadyExistsError extends Error {
  constructor() {
    super("Organization already exists");
    this.name = "OrganizationAlreadyExistsError";
  }
}

export class UserAlreadyExistsError extends Error {
  constructor() {
    super("User already exists");
    this.name = "UserAlreadyExistsError";
  }
}

export class RoleNotFoundError extends Error {
  constructor() {
    super("Role not found");
    this.name = "RoleNotFoundError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
