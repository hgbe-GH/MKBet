import type { JsonObject, OddsErrorCode } from "./types";

export class OddsDomainError extends Error {
  readonly code: OddsErrorCode;
  readonly details: JsonObject;

  constructor(code: OddsErrorCode, message: string, details: JsonObject = {}) {
    super(message);
    this.name = "OddsDomainError";
    this.code = code;
    this.details = details;
  }
}
