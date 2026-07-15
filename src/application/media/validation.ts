import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedMediaTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const mediaUploadSchema = z.object({
  name: z.string(),
  size: z.number().finite().positive().max(MAX_FILE_SIZE),
  type: z.enum(allowedMediaTypes),
});

const mediaUploadFormSchema = z.object({
  caption: z.string().max(500).optional(),
  file: z.unknown(),
  seasonId: z.string().uuid(),
});

export type MediaUploadValidation =
  { ok: true } | { ok: false; message: string };

export type MediaUploadFormValidation =
  | { ok: true; seasonId: string; caption: string | null }
  | { ok: false; message: string };

export function validateMediaUpload(input: unknown): MediaUploadValidation {
  const result = mediaUploadSchema.safeParse(input);
  if (result.success) return { ok: true };
  return {
    ok: false,
    message: "Choisis une image JPEG, PNG ou WebP de 10 Mo maximum.",
  };
}

export function validateMediaUploadForm(
  input: unknown,
): MediaUploadFormValidation {
  const result = mediaUploadFormSchema.safeParse(input);
  if (result.success) {
    return {
      ok: true,
      seasonId: result.data.seasonId,
      caption: result.data.caption?.trim() || null,
    };
  }
  return {
    ok: false,
    message: "Vérifie la saison et la légende du média.",
  };
}

export function buildSeasonMediaPath(
  seasonId: string,
  userId: string,
  mediaId: string,
): string {
  return `${seasonId}/${userId}/${mediaId}.webp`;
}
