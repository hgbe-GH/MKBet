import { z } from "zod";

import { EVENT_REPORT_TYPES } from "@/domain/events/types";

export { EVENT_REPORT_TYPES } from "@/domain/events/types";

export const MAX_EVENT_EVIDENCE_FILES = 5;
export const MAX_EVENT_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;

const evidenceMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const eventEvidenceFileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_EVENT_EVIDENCE_FILE_SIZE),
  type: evidenceMimeTypeSchema,
});

const uuidSchema = z.uuid();

export const createEventReportFormSchema = (now: Date = new Date()) =>
  z
    .object({
      reportType: z.enum(EVENT_REPORT_TYPES),
      occurredAt: z.iso
        .datetime({ offset: false })
        .refine((value) => Date.parse(value) <= now.getTime(), {
          message: "La date de l’événement ne peut pas être future.",
        }),
      note: z.string().trim().min(1).max(500),
      marketId: uuidSchema.optional(),
      outcomeId: uuidSchema.optional(),
      files: z
        .array(eventEvidenceFileSchema)
        .max(MAX_EVENT_EVIDENCE_FILES)
        .default([]),
    })
    .superRefine((value, context) => {
      if ((value.marketId === undefined) !== (value.outcomeId === undefined)) {
        context.addIssue({
          code: "custom",
          message: "Le marché et l’issue doivent être sélectionnés ensemble.",
          path: value.marketId === undefined ? ["marketId"] : ["outcomeId"],
        });
      }
    });

export const eventReportFormSchema = createEventReportFormSchema();

export type EventReportFormInput = z.input<typeof eventReportFormSchema>;
export type EventReportFormData = z.output<typeof eventReportFormSchema>;
export type EventEvidenceFile = z.output<typeof eventEvidenceFileSchema>;
