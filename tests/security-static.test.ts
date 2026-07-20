// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("security static checks", () => {
  it("does not import the admin Supabase client from client components", () => {
    const clientSources = [
      "src/components/auth/password-field.tsx",
      "src/components/auth/sign-in-form.tsx",
      "src/components/auth/sign-up-form.tsx",
      "src/components/invitations/invitation-panel.tsx",
      "src/components/seasons/season-selector.tsx",
    ];

    for (const source of clientSources) {
      expect(read(source)).not.toContain("@/lib/supabase/admin");
      expect(read(source)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("keeps the service role out of public configuration and browser code", () => {
    expect(read("src/config/env.ts")).not.toContain(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    expect(read("src/lib/supabase/browser.ts")).not.toContain(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  });
});
