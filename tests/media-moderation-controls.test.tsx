import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { moderateMediaAction, refresh } = vi.hoisted(() => ({
  moderateMediaAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/application/media/actions", () => ({ moderateMediaAction }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { MediaModerationControls } from "@/components/media/media-moderation-controls";

describe("MediaModerationControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    moderateMediaAction.mockResolvedValue(undefined);
  });

  it("refreshes canonical server data after an administrator approval", async () => {
    render(<MediaModerationControls mediaId="media-id" status="PENDING" />);

    fireEvent.click(screen.getByRole("button", { name: "APPROUVER" }));

    await waitFor(() => {
      expect(moderateMediaAction).toHaveBeenCalledWith("media-id", "APPROVED");
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
