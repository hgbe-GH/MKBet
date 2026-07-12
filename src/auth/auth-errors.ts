export const AUTH_ERROR_CODES = [
  "AUTH_REQUIRED",
  "AUTH_INVALID_SESSION",
  "AUTH_EMAIL_SEND_FAILED",
  "AUTH_CALLBACK_FAILED",
  "SUPABASE_NOT_CONFIGURED",
  "PROFILE_NOT_FOUND",
  "SEASON_NOT_FOUND",
  "SEASON_ACCESS_DENIED",
  "INVITATION_INVALID",
  "INVITATION_EXPIRED",
  "INVITATION_ALREADY_USED",
  "INVITATION_EMAIL_MISMATCH",
  "INVITATION_ROLE_INVALID",
  "LAST_ADMIN_PROTECTED",
  "DATABASE_OPERATION_FAILED",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export class AuthApplicationError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthApplicationError";
  }
}

export interface ActionFailure {
  ok: false;
  code: AuthErrorCode;
  message: string;
}

export interface ActionSuccess {
  ok: true;
  message: string;
}

export type ActionResult = ActionFailure | ActionSuccess;
