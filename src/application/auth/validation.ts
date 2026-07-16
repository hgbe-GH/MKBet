import { z } from "zod";

import { sanitizeInternalRedirectPath } from "@/application/auth";

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

const optionalText = z
  .preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }
    const normalized = normalizeSpaces(value);
    return normalized.length > 0 ? normalized : null;
  }, z.string().min(1).max(500).nullable())
  .default(null);

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresse email invalide")
  .max(320);

const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères")
  .max(128);

const safeNextSchema = z
  .preprocess((value) => sanitizeInternalRedirectPath(value), z.string())
  .default("/direct");

export const signInFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  next: safeNextSchema,
});

export const signUpFormSchema = z
  .object({
    email: emailSchema,
    displayName: z
      .string()
      .transform(normalizeSpaces)
      .pipe(z.string().min(2).max(80))
      .refine(
        (value) => !/[<>]/.test(value),
        "Le nom ne peut pas contenir HTML",
      ),
    password: passwordSchema,
    passwordConfirmation: passwordSchema,
    next: safeNextSchema,
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["passwordConfirmation"],
  });

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: passwordSchema,
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["passwordConfirmation"],
  });

/** @deprecated Removed in the password actions task. */
export const loginFormSchema = z.object({
  email: emailSchema,
  displayName: z
    .preprocess((value) => {
      if (typeof value !== "string") {
        return null;
      }
      const normalized = normalizeSpaces(value);
      return normalized.length > 0 ? normalized : null;
    }, z.string().min(2).max(80).nullable())
    .default(null),
  next: safeNextSchema,
});

export const seasonFormSchema = z.object({
  title: z.string().transform(normalizeSpaces).pipe(z.string().min(2).max(120)),
  description: optionalText,
  breakupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startedAt: z.string().datetime({ offset: true }),
  startingBalanceMkb: z.coerce.number().int().min(0).max(1_000_000),
  secretBetsUntilClose: z.preprocess(
    (value) => value === "on" || value === true,
    z.boolean(),
  ),
  idempotencyKey: z.string().uuid().optional(),
});

export const invitationTokenSchema = z
  .string()
  .trim()
  .min(16)
  .max(256)
  .regex(/^[A-Za-z0-9._-]+$/);

export const createInvitationSchema = z.object({
  seasonId: z.string().uuid(),
  proposedRole: z.enum(["ADMIN", "LIVE_HOST", "REPORTER", "PLAYER", "SUBJECT"]),
  proposedSubjectKey: z.enum(["MARGOT", "KEVIN"]).nullable().default(null),
  email: z
    .preprocess((value) => {
      if (typeof value !== "string") {
        return null;
      }
      const normalized = value.trim().toLowerCase();
      return normalized.length > 0 ? normalized : null;
    }, z.string().email().max(320).nullable())
    .default(null),
  expiresAt: z.string().datetime({ offset: true }),
  maxUses: z.coerce.number().int().min(1).max(25).default(1),
});

export const updateAccountSchema = z.object({
  displayName: z
    .string()
    .transform(normalizeSpaces)
    .pipe(z.string().min(2).max(80))
    .refine((value) => !/[<>]/.test(value), "Le nom ne peut pas contenir HTML"),
  avatarUrl: z
    .preprocess((value) => {
      if (typeof value !== "string") {
        return null;
      }
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    }, z.string().url().max(500).nullable())
    .default(null),
});

export type SignInFormInput = z.infer<typeof signInFormSchema>;
export type SignUpFormInput = z.infer<typeof signUpFormSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
/** @deprecated Removed in the password actions task. */
export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type SeasonFormInput = z.infer<typeof seasonFormSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
