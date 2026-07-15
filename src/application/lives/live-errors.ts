const LIVE_ERROR_CODES = [
  "AUTH_REQUIRED",
  "SEASON_NOT_FOUND",
  "SEASON_NOT_ACTIVE",
  "SEASON_ACCESS_DENIED",
  "LIVE_TITLE_INVALID",
  "LIVE_DESCRIPTION_INVALID",
  "LIVE_LOCATION_INVALID",
  "LIVE_TYPE_INVALID",
  "LIVE_SCHEDULE_INVALID",
  "LIVE_HOST_REQUIRED",
  "LIVE_HOST_ASSIGNMENT_DENIED",
  "LIVE_PARTICIPANT_INVALID",
  "IDEMPOTENCY_CONFLICT",
  "DATABASE_OPERATION_FAILED",
] as const;

type LiveErrorCode = (typeof LIVE_ERROR_CODES)[number];

const messages: Record<LiveErrorCode, string> = {
  AUTH_REQUIRED: "Connecte-toi pour créer un live.",
  SEASON_NOT_FOUND: "Cette saison est introuvable.",
  SEASON_NOT_ACTIVE: "Cette saison n’accepte plus de nouveaux lives.",
  SEASON_ACCESS_DENIED: "Tu n’as pas le rôle requis pour créer ce live.",
  LIVE_TITLE_INVALID: "Le titre du live est invalide.",
  LIVE_DESCRIPTION_INVALID: "La description du live est trop longue.",
  LIVE_LOCATION_INVALID: "Le lieu du live est trop long.",
  LIVE_TYPE_INVALID: "Le type de live est invalide.",
  LIVE_SCHEDULE_INVALID: "Vérifie les dates planifiées du live.",
  LIVE_HOST_REQUIRED: "Choisis un hôte actif disposant du rôle LIVE_HOST.",
  LIVE_HOST_ASSIGNMENT_DENIED:
    "Un hôte live ne peut créer un live que pour lui-même.",
  LIVE_PARTICIPANT_INVALID:
    "Un participant est absent ou inactif dans cette saison.",
  IDEMPOTENCY_CONFLICT: "Cette création ne peut pas être répétée ainsi.",
  DATABASE_OPERATION_FAILED:
    "Le live n’a pas pu être enregistré. Réessaie dans quelques instants.",
};

export function extractLiveErrorCode(error: unknown): LiveErrorCode {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    const code = LIVE_ERROR_CODES.find((candidate) =>
      message.includes(candidate),
    );
    if (code) return code;
  }
  return "DATABASE_OPERATION_FAILED";
}

export function mapLiveErrorToMessage(code: LiveErrorCode): string {
  return messages[code];
}
