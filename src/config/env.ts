import { z } from "zod";

const siteUrlSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const publicSupabaseSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
  })
  .superRefine((value, context) => {
    if (
      !value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      !value.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      context.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
        message: "Required",
      });
    }
  });

export interface PublicSupabaseEnv {
  url: string;
  publishableKey: string;
}

export function formatConfigurationError(
  context: string,
  variables: readonly string[],
): Error {
  return new Error(
    `${context}: ${variables.join(", ")} is missing or invalid. ` +
      "Configure it locally in .env.local and separately in Vercel.",
  );
}

function parseEnvironment<T>(
  schema: z.ZodType<T>,
  values: Record<string, string | undefined>,
  context: string,
): T {
  const result = schema.safeParse(values);

  if (result.success) {
    return result.data;
  }

  const invalidVariables = Array.from(
    new Set(
      result.error.issues
        .map((issue) => issue.path[0])
        .filter((key): key is string => typeof key === "string"),
    ),
  );

  throw formatConfigurationError(context, invalidVariables);
}

export function getSiteUrl(): string {
  const env = parseEnvironment(
    siteUrlSchema,
    { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
    "Site configuration error",
  );

  return env.NEXT_PUBLIC_SITE_URL;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const env = parseEnvironment(
    publicSupabaseSchema,
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    "Supabase public configuration error",
  );

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
  };
}
