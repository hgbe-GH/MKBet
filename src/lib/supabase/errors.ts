export const SUPABASE_NOT_CONFIGURED = "SUPABASE_NOT_CONFIGURED" as const;

export class SupabaseConfigurationError extends Error {
  readonly code = SUPABASE_NOT_CONFIGURED;

  constructor(message = "Supabase is not configured for this environment.") {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export function toSupabaseConfigurationError(error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    return error;
  }

  if (
    error instanceof Error &&
    /Supabase .*configuration error/.test(error.message)
  ) {
    return new SupabaseConfigurationError(error.message);
  }

  return null;
}
