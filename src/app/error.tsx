"use client";

import { StatusPage } from "@/components/layout/status-page";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <StatusPage
      actionLabel="RÉESSAYER"
      description="Le tableau des marchés a rencontré un incident temporaire."
      eyebrow={error.digest ? `Incident ${error.digest}` : "Incident technique"}
      onAction={reset}
      title="La séance est suspendue"
    />
  );
}
