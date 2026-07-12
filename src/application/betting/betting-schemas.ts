import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createBetQuoteSchema = z.object({
  seasonId: uuidSchema,
  stakeMkb: z.coerce.number().int().min(5).max(1_000_000),
  outcomeIds: z
    .array(uuidSchema)
    .min(1)
    .max(3)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Les issues doivent être uniques.",
    }),
  idempotencyKey: uuidSchema,
});

export const placeBetSchema = z.object({
  quoteId: uuidSchema,
  idempotencyKey: uuidSchema,
});

export const marketAdministrationSchema = z
  .object({
    seasonId: uuidSchema,
    templateCode: z
      .string()
      .trim()
      .regex(/^[A-Z][A-Z0-9_]*$/),
    deadlineAt: z.string().datetime({ offset: true }),
    opensAt: z.string().datetime({ offset: true }),
    closesAt: z.string().datetime({ offset: true }),
    titleOverride: z.string().trim().max(160).nullable().default(null),
    trashTitleOverride: z.string().trim().max(160).nullable().default(null),
    description: z.string().trim().max(1_000).nullable().default(null),
    idempotencyKey: uuidSchema,
  })
  .refine((value) => Date.parse(value.closesAt) > Date.parse(value.opensAt), {
    message: "La clôture doit suivre l'ouverture.",
    path: ["closesAt"],
  })
  .refine(
    (value) => Date.parse(value.deadlineAt) > Date.parse(value.closesAt),
    {
      message: "L'échéance doit suivre la clôture.",
      path: ["deadlineAt"],
    },
  );

export type CreateBetQuoteInput = z.infer<typeof createBetQuoteSchema>;
export type PlaceBetInput = z.infer<typeof placeBetSchema>;
export type MarketAdministrationInput = z.infer<
  typeof marketAdministrationSchema
>;
