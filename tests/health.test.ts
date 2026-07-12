import { GET } from "@/app/api/health/route";
import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns the public health contract without sensitive details", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      application: "mk-bet",
    });
  });
});
