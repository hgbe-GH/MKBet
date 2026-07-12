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
    <main className="grid min-h-screen place-items-center bg-stone-100 px-5 py-12 text-stone-950">
      <section className="w-full max-w-xl border-t-4 border-red-900 bg-white p-7 shadow-[0_18px_50px_rgba(41,37,36,0.08)] sm:p-10">
        <p className="mb-4 text-xs font-black tracking-[0.18em] text-red-800 uppercase">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md leading-7 text-stone-600">{description}</p>
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
