import { describe, expect, it } from "vitest";

import {
  buildSeasonMediaPath,
  validateMediaUploadForm,
  validateMediaUpload,
} from "@/application/media/validation";

const seasonId = "10000000-0000-4000-8000-000000000001";
const userId = "20000000-0000-4000-8000-000000000001";

describe("season media validation", () => {
  it("accepts a non-empty JPEG no larger than 10 MiB", () => {
    expect(
      validateMediaUpload({
        name: "souvenir.jpg",
        size: 1024,
        type: "image/jpeg",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects unsupported, empty and oversized files with one safe message", () => {
    for (const file of [
      { name: "archive.gif", size: 1024, type: "image/gif" },
      { name: "empty.webp", size: 0, type: "image/webp" },
      { name: "large.png", size: 10 * 1024 * 1024 + 1, type: "image/png" },
    ]) {
      expect(validateMediaUpload(file)).toEqual({
        ok: false,
        message: "Choisis une image JPEG, PNG ou WebP de 10 Mo maximum.",
      });
    }
  });

  it("builds the only accepted private Storage path", () => {
    expect(buildSeasonMediaPath(seasonId, userId, "media-uuid")).toBe(
      `${seasonId}/${userId}/media-uuid.webp`,
    );
  });

  it("rejects a malformed season identifier before an upload is attempted", () => {
    expect(
      validateMediaUploadForm({
        caption: "Souvenir",
        file: { name: "souvenir.webp", size: 1024, type: "image/webp" },
        seasonId: "not-a-uuid",
      }),
    ).toEqual({
      ok: false,
      message: "Vérifie la saison et la légende du média.",
    });
  });
});
