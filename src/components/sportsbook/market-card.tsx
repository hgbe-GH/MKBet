"use client";

import Link from "next/link";

import { useBetSlip } from "@/components/sportsbook/bet-slip-context";
import { LiveBadge } from "@/components/sportsbook/live-badge";
import { OddsButton } from "@/components/sportsbook/odds-button";
import { StatusBadge } from "@/components/sportsbook/status-badge";
import type { SportsbookMarket } from "@/fixtures/sportsbook/types";
import { cn } from "@/lib/utils";

function marketTypeLabel(type: SportsbookMarket["type"]) {
  if (type === "BINARY") {
    return "Binaire";
  }
  if (type === "MULTI_OUTCOME" || type === "NEXT_ACTION") {
    return "Multi-options";
  }
  if (type === "OVER_UNDER") {
    return "Over / Under";
  }
  if (type === "EXACT_DATE" || type === "DATE_RANGE") {
    return "Date";
  }
  return "Combiné";
}

export function MarketCard({ market }: { market: SportsbookMarket }) {
  const betSlip = useBetSlip();

  return (
    <article className="mk-slide-up rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_10px_30px_rgba(28,25,23,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {market.isLive ? <LiveBadge /> : null}
            <StatusBadge
              tone={
                market.status === "OPEN"
                  ? "positive"
                  : market.status === "SUSPENDED"
                    ? "warning"
                    : "muted"
              }
            >
              {market.status}
            </StatusBadge>
            <StatusBadge>{marketTypeLabel(market.type)}</StatusBadge>
          </div>
          <h2 className="text-lg font-black tracking-[-0.025em] text-[var(--text-primary)]">
            <Link
              className="inline-flex min-h-11 items-center"
              href={`/markets/${market.id}`}
            >
              {market.title}
            </Link>
          </h2>
          {market.trashTitle ? (
            <p className="text-xs font-bold text-[var(--brand)]">
              {market.trashTitle}
            </p>
          ) : null}
        </div>
        <div className="text-right text-xs text-[var(--text-muted)]">
          <p>
            {market.betCount > 0
              ? `${market.betCount} tickets`
              : "Volume privé"}
          </p>
          <p>{new Date(market.deadline).toLocaleString("fr-FR")}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        {market.description}
      </p>
      {market.lastAction ? (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-900">
          Dernier signal : {market.lastAction}
        </p>
      ) : null}
      {market.suspensionReason ? (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          Suspension : {market.suspensionReason}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-4 grid gap-2 sm:grid-cols-2",
          market.outcomes.length > 2 && "lg:grid-cols-3",
        )}
      >
        {market.outcomes.map((outcome) => (
          <OddsButton
            key={outcome.id}
            handicap={outcome.handicap}
            line={outcome.line}
            marketId={market.id}
            marketTitle={market.title}
            movement={outcome.movement}
            odds={outcome.odds}
            oddsVersion={market.oddsVersion}
            outcomeId={outcome.id}
            outcomeLabel={outcome.label}
            selected={betSlip.isSelected(market.id, outcome.id)}
            status={outcome.status}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs font-bold text-[var(--text-muted)]">
        <span>{market.category}</span>
        <span>{market.variationLabel}</span>
      </div>
    </article>
  );
}
