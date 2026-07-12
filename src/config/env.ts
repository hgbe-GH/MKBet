import "server-only";

import { z } from "zod";

const siteUrlSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSupabaseSchema = publicSupabaseSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export interface PublicSupabaseEnv {
  url: string;
  anonKey: string;
}

export interface ServerSupabaseEnv extends PublicSupabaseEnv {
  serviceRoleKey: string;
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

  throw new Error(
    `${context}: ${invalidVariables.join(", ")} is missing or invalid. ` +
      "Configure it locally in .env.local and separately in Vercel.",
  );
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
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    "Supabase public configuration error",
  );

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getServerSupabaseEnv(): ServerSupabaseEnv {
  const env = parseEnvironment(
    serverSupabaseSchema,
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    "Supabase server configuration error",
  );

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
