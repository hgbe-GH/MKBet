import { execFileSync } from "node:child_process";

import { z } from "zod";

const statusEnvironmentSchema = z
  .object({
    API_URL: z.string().url(),
    DB_URL: z.string().url(),
    ANON_KEY: z.string().min(1).optional(),
    PUBLISHABLE_KEY: z.string().min(1).optional(),
    SERVICE_ROLE_KEY: z.string().min(1),
  })
  .refine((value) => value.PUBLISHABLE_KEY || value.ANON_KEY, {
    message: "A local Supabase publishable key is required.",
  });

function parseShellValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return z.string().parse(JSON.parse(trimmed));
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export interface LocalSupabaseEnvironment {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
  dbUrl: string;
}

export function getLocalSupabaseEnvironment(): LocalSupabaseEnvironment {
  const output = execFileSync(
    "pnpm",
    ["exec", "supabase", "status", "-o", "env"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  const values = Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.match(/^([A-Z_]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], parseShellValue(match[2] ?? "")]),
  );
  const environment = statusEnvironmentSchema.parse(values);

  return {
    url: environment.API_URL,
    publishableKey: environment.PUBLISHABLE_KEY ?? environment.ANON_KEY ?? "",
    serviceRoleKey: environment.SERVICE_ROLE_KEY,
    dbUrl: environment.DB_URL,
  };
}

export function getNextE2EEnvironment(): NodeJS.ProcessEnv {
  const environment = getLocalSupabaseEnvironment();
  return {
    ...process.env,
    MK_BET_E2E: "1",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
    NEXT_PUBLIC_SUPABASE_URL: environment.url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: environment.publishableKey,
  };
}
