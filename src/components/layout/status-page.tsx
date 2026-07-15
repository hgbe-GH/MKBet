import Link from "next/link";

import { Button } from "@/components/ui/button";

interface StatusPageProps {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function StatusPage({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: StatusPageProps) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12 text-white">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--brand)]/25 blur-3xl"
      />
      <section className="mk-surface-opaque relative w-full max-w-xl rounded-2xl p-7 sm:p-10">
        <p className="mb-4 text-xs font-black tracking-[0.18em] text-[var(--brand-hover)] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md leading-7 text-[var(--text-secondary)]">
          {description}
        </p>
        {actionLabel && actionHref ? (
          <Button asChild className="mt-8">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
        {actionLabel && onAction ? (
          <Button className="mt-8" onClick={onAction} type="button">
            {actionLabel}
          </Button>
        ) : null}
      </section>
    </main>
  );
}
