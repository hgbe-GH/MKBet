import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/application/events/actions", () => ({
  submitEventReportAction: vi.fn(),
  voteEventReportAction: vi.fn(),
}));

import { EventReportCard } from "@/components/events/event-report-card";
import { EventReportForm } from "@/components/events/event-report-form";
import { EventVoteControls } from "@/components/events/event-vote-controls";
import type { EventReportView } from "@/domain/events/types";
import { voteEventReportAction } from "@/application/events/actions";

const pendingReport: EventReportView = {
  id: "report-1",
  author: { id: "alice", displayName: "Alice", avatarUrl: null },
  reportType: "KISS",
  occurredAt: "2026-07-15T14:00:00.000Z",
  declaredAt: "2026-07-15T14:05:00.000Z",
  note: "Un baiser observé à la sortie du bar.",
  status: "PENDING",
  evidence: [
    { id: "media-1", caption: "Preuve du baiser", mediaType: "image/webp" },
  ],
  market: { id: "market-1", title: "Premier bisou", outcomeLabel: "Oui" },
  votes: {
    confirmCount: 1,
    rejectCount: 0,
    currentUserDecision: null,
    voters: [{ displayName: "Bob", decision: "CONFIRM" }],
  },
};

describe("EventReportCard", () => {
  it("shows evidence, exact vote counts and two accessible decisions", () => {
    render(<EventReportCard currentUserId="bob" report={pendingReport} />);

    expect(
      screen.getByRole("heading", { name: "Bisou sur la bouche" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Signalé par Alice")).toBeInTheDocument();
    expect(screen.getByAltText("Preuve du baiser")).toHaveAttribute(
      "src",
      "/api/media/media-1",
    );
    expect(screen.getByText("1 validation sur 2")).toBeInTheDocument();
    expect(screen.getByText("0 invalidation sur 2")).toBeInTheDocument();
    expect(screen.getByText(/Événement du/)).toBeInTheDocument();
    expect(screen.getByText(/Déclaré le/)).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAttribute(
      "data-report-status",
      "PENDING",
    );
    expect(
      screen.getByRole("button", { name: "Valider ce fait" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Invalider ce fait" }),
    ).toBeEnabled();
  });

  it("never lets the author vote on their own report", () => {
    render(<EventReportCard currentUserId="alice" report={pendingReport} />);

    expect(
      screen.queryByRole("button", { name: "Valider ce fait" }),
    ).toBeNull();
    expect(
      screen.getByText("Tu ne peux pas voter sur ton propre signalement."),
    ).toBeInTheDocument();
  });
});

describe("EventVoteControls", () => {
  it("replaces decisions with the durable local vote after success", async () => {
    vi.mocked(voteEventReportAction).mockResolvedValue({
      ok: true,
      message: "Ton vote est enregistré.",
    });
    render(<EventVoteControls reportId="report-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Invalider ce fait" }));
    expect(
      screen.getByRole("alertdialog", { name: "Invalider ce fait ?" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    await waitFor(() =>
      expect(screen.getByText("Ton vote : invalidation.")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "Valider ce fait" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Invalider ce fait" }),
    ).toBeNull();
  });
});

describe("EventReportForm", () => {
  it("exposes labelled event, UTC time, note, market and private proofs", () => {
    render(
      <EventReportForm
        markets={[
          {
            id: "market-1",
            title: "Premier bisou",
            outcomes: [{ id: "outcome-1", label: "Oui" }],
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Type d’événement")).toBeInTheDocument();
    expect(screen.getByLabelText("Date et heure réelles")).toHaveAttribute(
      "type",
      "datetime-local",
    );
    expect(screen.getByLabelText("Ce qui s’est passé")).toHaveAttribute(
      "maxlength",
      "500",
    );
    expect(screen.getByLabelText("Marché concerné")).toBeInTheDocument();
    expect(screen.getByLabelText("Preuves privées")).toHaveAttribute(
      "multiple",
    );
    expect(
      screen.getByText(/visibles uniquement par les comptes connectés/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Envoyer au vote" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("group", { name: "1. Événement" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "2. Moment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "3. Marché concerné" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "4. Preuves privées" }),
    ).toBeInTheDocument();
  });
});
