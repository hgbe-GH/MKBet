export const BETTING_ERROR_CODES = [
  "AUTH_REQUIRED",
  "PROFILE_NOT_FOUND",
  "SEASON_NOT_FOUND",
  "SEASON_NOT_ACTIVE",
  "SEASON_ACCESS_DENIED",
  "PLAYER_ROLE_REQUIRED",
  "WALLET_NOT_FOUND",
  "INSUFFICIENT_BALANCE",
  "INVALID_STAKE",
  "INVALID_SELECTION_COUNT",
  "OUTCOME_NOT_FOUND",
  "DUPLICATE_MARKET_SELECTION",
  "MARKET_NOT_OPEN",
  "MARKET_ALREADY_CLOSED",
  "OUTCOME_NOT_AVAILABLE",
  "MISSING_CORRELATION_RULE",
  "QUOTE_NOT_FOUND",
  "QUOTE_EXPIRED",
  "QUOTE_ALREADY_CONSUMED",
  "QUOTE_ACCESS_DENIED",
  "ODDS_CHANGED",
  "IDEMPOTENCY_CONFLICT",
  "DATABASE_OPERATION_FAILED",
] as const;

export type BettingErrorCode = (typeof BETTING_ERROR_CODES)[number];

const MESSAGES: Record<BettingErrorCode, string> = {
  AUTH_REQUIRED: "Connecte-toi pour enregistrer un pronostic.",
  PROFILE_NOT_FOUND: "Ton profil joueur est introuvable.",
  SEASON_NOT_FOUND: "Cette saison est introuvable.",
  SEASON_NOT_ACTIVE: "Cette saison n'accepte pas de nouveaux pronostics.",
  SEASON_ACCESS_DENIED: "Tu n'as pas accès à cette saison.",
  PLAYER_ROLE_REQUIRED: "Le rôle joueur est requis pour miser des MKB.",
  WALLET_NOT_FOUND: "Ton portefeuille MKB est introuvable.",
  INSUFFICIENT_BALANCE:
    "Ton capital de dignité est insuffisant pour cette mise.",
  INVALID_STAKE: "La mise doit être un nombre entier d'au moins 5 MKB.",
  INVALID_SELECTION_COUNT: "Le ticket doit contenir entre une et trois issues.",
  OUTCOME_NOT_FOUND: "Une issue du ticket est introuvable.",
  DUPLICATE_MARKET_SELECTION:
    "Une seule issue peut être sélectionnée par marché.",
  MARKET_NOT_OPEN: "Un marché du ticket n'est plus ouvert.",
  MARKET_ALREADY_CLOSED: "Ce marché est déjà clôturé.",
  OUTCOME_NOT_AVAILABLE: "Une issue du ticket n'est plus disponible.",
  MISSING_CORRELATION_RULE:
    "Ce combiné est trop douteux pour être coté correctement.",
  QUOTE_NOT_FOUND: "Le devis de ce ticket est introuvable.",
  QUOTE_EXPIRED: "Le devis a expiré. Actualise les cotes.",
  QUOTE_ALREADY_CONSUMED: "Ce devis a déjà été utilisé.",
  QUOTE_ACCESS_DENIED: "Ce devis ne t'appartient pas.",
  ODDS_CHANGED:
    "Les cotes ont évolué. Vérifie le nouveau ticket avant de confirmer.",
  IDEMPOTENCY_CONFLICT: "Cette opération a déjà été utilisée autrement.",
  DATABASE_OPERATION_FAILED:
    "L'opération n'a pas pu être enregistrée. Réessaie dans quelques instants.",
};

export function isBettingErrorCode(value: unknown): value is BettingErrorCode {
  return (
    typeof value === "string" &&
    (BETTING_ERROR_CODES as readonly string[]).includes(value)
  );
}

export function mapBettingErrorToMessage(code: BettingErrorCode): string {
  return MESSAGES[code];
}

export function extractBettingErrorCode(error: unknown): BettingErrorCode {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    const code = BETTING_ERROR_CODES.find((candidate) =>
      message.includes(candidate),
    );
    if (code) return code;
  }
  return "DATABASE_OPERATION_FAILED";
}
