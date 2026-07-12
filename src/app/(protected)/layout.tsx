import Link from "next/link";
import type { ReactNode } from "react";

import { requireAuth } from "@/auth/require-auth";

export const dynamic = "force-dynamic";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  await requireAuth("/seasons");

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <header className="border-b border-red-950 bg-red-950 text-white">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            className="rounded-sm text-xl font-black tracking-[-0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-red-950"
            href="/seasons"
          >
            MK <span className="text-red-300">BET</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold">
            <Link className="focus-visible:outline-red-200" href="/seasons">
              Saisons
            </Link>
            <Link
              className="focus-visible:outline-red-200"
              href="/settings/account"
            >
              Compte
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
