const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "You do not have permission to perform this action",
  USER_NOT_FOUND: "User not found",
  USER_INACTIVE: "Your account has been deactivated",
  INVITE_NOT_FOUND: "Invalid or expired invite",
  INVITE_EXPIRED: "This invite has expired",
  INVITE_ALREADY_USED: "This invite has already been used",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  PROJECT_NOT_FOUND: "Project not found",
  INVALID_TOKEN: "Invalid or expired token",
};

module.exports = { HTTP_STATUS, ERROR_MESSAGES };
