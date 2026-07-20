import { z } from "zod";

const authenticationMethodSchema = z.union([
  z.string(),
  z.object({ method: z.string() }),
]);

const authenticationClaimsSchema = z.object({
  amr: z.array(authenticationMethodSchema),
});

export function hasValidAuthenticationMethods(claims: unknown): boolean {
  return authenticationClaimsSchema.safeParse(claims).success;
}

export function hasRecoveryAuthenticationMethod(claims: unknown): boolean {
  const parsed = authenticationClaimsSchema.safeParse(claims);

  if (!parsed.success) {
    return false;
  }

  return parsed.data.amr.some((entry) =>
    typeof entry === "string"
      ? entry === "recovery"
      : entry.method === "recovery",
  );
}
