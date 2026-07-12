"use client";

import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="fr">
      <body>
        <main className="grid min-h-screen place-items-center bg-stone-100 px-5 py-12 text-stone-950">
          <section className="w-full max-w-xl border-t-4 border-red-900 bg-white p-7 shadow-[0_18px_50px_rgba(41,37,36,0.08)] sm:p-10">
            <p className="text-xs font-black tracking-[0.18em] text-red-800 uppercase">
              {error.digest ? `Incident ${error.digest}` : "Incident global"}
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              La salle est momentanément fermée
            </h1>
            <p className="mt-4 leading-7 text-stone-600">
              Une erreur inattendue a interrompu la séance.
            </p>
            <Button className="mt-8" onClick={reset} type="button">
              RÉESSAYER
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
