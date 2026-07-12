import type { AuthErrorCode } from "@/auth/auth-errors";

const DEFAULT_REDIRECT = "/seasons";

const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  AUTH_REQUIRED: "Connecte-toi pour accéder à cette page.",
  AUTH_INVALID_SESSION: "La session n'est plus valide. Reconnecte-toi.",
  AUTH_EMAIL_SEND_FAILED:
    "Impossible d'envoyer le lien d'accès. Réessaie dans quelques instants.",
  AUTH_CALLBACK_FAILED:
    "Le lien d'accès n'a pas pu être validé. Demande un nouveau lien.",
  SUPABASE_NOT_CONFIGURED:
    "Supabase n'est pas encore configuré pour cet environnement.",
  PROFILE_NOT_FOUND: "Le profil joueur est introuvable.",
  SEASON_NOT_FOUND: "Cette saison est introuvable.",
  SEASON_ACCESS_DENIED: "Tu n'as pas accès à cette saison.",
  INVITATION_INVALID: "Cette invitation est invalide.",
  INVITATION_EXPIRED: "Ce ticket d'entrée n'est plus coté.",
  INVITATION_ALREADY_USED: "Cette invitation a déjà clôturé.",
  INVITATION_EMAIL_MISMATCH:
    "Cette invitation est réservée à une autre adresse.",
  INVITATION_ROLE_INVALID: "Le rôle proposé par cette invitation est invalide.",
  LAST_ADMIN_PROTECTED:
    "Impossible de retirer le dernier administrateur actif de la saison.",
  DATABASE_OPERATION_FAILED:
    "L'opération n'a pas pu être enregistrée. Réessaie dans quelques instants.",
};

export function sanitizeInternalRedirectPath(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_REDIRECT;
  }

  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return DEFAULT_REDIRECT;
  }

  try {
    const parsed = new URL(trimmed, "https://mk-bet.local");
    if (parsed.origin !== "https://mk-bet.local") {
      return DEFAULT_REDIRECT;
    }
    if (parsed.protocol !== "https:") {
      return DEFAULT_REDIRECT;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

export function mapAuthErrorToMessage(code: AuthErrorCode): string {
  return AUTH_MESSAGES[code];
}
