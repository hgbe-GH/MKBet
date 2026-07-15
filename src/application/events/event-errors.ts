const EVENT_ERROR_MESSAGES = {
  AUTH_REQUIRED: "Connecte-toi pour continuer.",
  EVENT_SELF_VOTE_FORBIDDEN: "Tu ne peux pas voter sur ton propre événement.",
  EVENT_VOTE_IMMUTABLE: "Ton vote est définitif et ne peut plus être modifié.",
  EVENT_REPORT_ALREADY_RESOLVED: "Cet événement a déjà été tranché.",
  EVENT_REPORT_NOT_FOUND: "Cet événement est introuvable.",
} as const;

export type EventErrorCode = keyof typeof EVENT_ERROR_MESSAGES;

export class EventApplicationError extends Error {
  constructor(
    public readonly code: EventErrorCode | "EVENT_OPERATION_FAILED",
    message?: string,
  ) {
    super(message ?? EVENT_ERROR_MESSAGES[code as EventErrorCode] ?? "L’opération a échoué.");
    this.name = "EventApplicationError";
  }
}

export function mapEventError(error: unknown): string {
  if (error instanceof EventApplicationError) return error.message;
  const message = error instanceof Error ? error.message : "";
  const code = Object.keys(EVENT_ERROR_MESSAGES).find((candidate) =>
    message.includes(candidate),
  ) as EventErrorCode | undefined;
  return code
    ? EVENT_ERROR_MESSAGES[code]
    : "L’opération n’a pas pu aboutir. Réessaie.";
}

