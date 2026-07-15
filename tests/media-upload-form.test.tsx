import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/application/media/actions", () => ({
  uploadSeasonMediaAction: vi.fn(),
}));

import { MediaUploadForm } from "@/components/media/media-upload-form";

describe("MediaUploadForm", () => {
  it("marks the upload form ready only after client hydration", async () => {
    render(<MediaUploadForm seasonId="10000000-0000-4000-8000-000000000001" />);

    await expect(
      screen.findByTestId("season-media-upload-form"),
    ).resolves.toHaveAttribute("data-upload-ready", "true");
  });
});
