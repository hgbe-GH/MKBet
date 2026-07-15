import { LoginForm } from "@/components/auth/login-form";
import { requestLoginLink } from "@/application/auth/actions";
import { sanitizeInternalRedirectPath } from "@/application/auth";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeInternalRedirectPath(params?.next);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12 text-white">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--brand)]/30 blur-3xl"
      />
      <section className="mk-glass-subtle relative w-full max-w-md rounded-2xl p-7 sm:p-10">
        <p className="mb-5 text-xs font-black tracking-[0.18em] text-[var(--brand-hover)] uppercase">
          MKBET · Salle privée
        </p>
        <LoginForm action={requestLoginLink} next={next} />
      </section>
    </main>
  );
}
