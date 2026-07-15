import { z } from "zod";

const uuidSchema = z.string().uuid();
const nullableIsoDateSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .default(null);

const attendeeSchema = z.object({
  userId: uuidSchema,
  liveRole: z.enum(["REPORTER", "VIEWER"]),
});

export const createLiveSessionSchema = z
  .object({
    seasonId: uuidSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1_000).nullable().default(null),
    locationLabel: z.string().trim().max(160).nullable().default(null),
    liveType: z.enum(["PROGRAMMED", "INSTANT", "TIME_WINDOW"]),
    hostUserId: uuidSchema,
    attendees: z.array(attendeeSchema).max(100),
    scheduledStart: nullableIsoDateSchema,
    scheduledEnd: nullableIsoDateSchema,
    idempotencyKey: uuidSchema,
  })
  .superRefine((value, context) => {
    const hasStart = value.scheduledStart !== null;
    const hasEnd = value.scheduledEnd !== null;
    const requiresSchedule =
      value.liveType === "PROGRAMMED" || value.liveType === "TIME_WINDOW";

    if (requiresSchedule && (!hasStart || !hasEnd)) {
      context.addIssue({
        code: "custom",
        message: "Un planning complet est requis pour ce type de live.",
        path: ["scheduledStart"],
      });
    }
    if (!requiresSchedule && hasStart !== hasEnd) {
      context.addIssue({
        code: "custom",
        message: "Le planning indicatif doit contenir un début et une fin.",
        path: ["scheduledStart"],
      });
    }
    if (
      value.scheduledStart !== null &&
      value.scheduledEnd !== null &&
      Date.parse(value.scheduledEnd) <= Date.parse(value.scheduledStart)
    ) {
      context.addIssue({
        code: "custom",
        message: "La fin doit suivre le début.",
        path: ["scheduledEnd"],
      });
    }
    if (value.attendees.some((attendee) => attendee.userId === value.hostUserId)) {
      context.addIssue({
        code: "custom",
        message: "L’hôte est ajouté automatiquement.",
        path: ["attendees"],
      });
    }
    if (
      new Set(value.attendees.map((attendee) => attendee.userId)).size !==
      value.attendees.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Un participant ne peut être ajouté qu’une fois.",
        path: ["attendees"],
      });
    }
  });

export type CreateLiveSessionInput = z.infer<typeof createLiveSessionSchema>;
