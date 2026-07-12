import type { SeasonMemberRole, SubjectKey } from "@/domain/database/enums";

export type InvitationPreviewReason =
  | "INVITATION_INVALID"
  | "INVITATION_EXPIRED"
  | "INVITATION_ALREADY_USED"
  | "INVITATION_EMAIL_MISMATCH";

export interface InvitationPreview {
  isValid: boolean;
  seasonTitle: string | null;
  proposedRole: SeasonMemberRole | null;
  proposedSubjectKey: SubjectKey | null;
  expiresAt: string | null;
  maskedEmail: string | null;
  reason: InvitationPreviewReason | null;
}
