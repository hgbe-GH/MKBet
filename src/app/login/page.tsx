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
    <main className="grid min-h-screen place-items-center bg-stone-100 px-5 py-12 text-stone-950">
      <section className="w-full max-w-md border-t-4 border-red-900 bg-white p-7 shadow-[0_18px_50px_rgba(41,37,36,0.08)] sm:p-10">
        <p className="mb-4 text-xs font-black tracking-[0.18em] text-red-800 uppercase">
          MK BET
        </p>
        <LoginForm action={requestLoginLink} next={next} />
      </section>
    </main>
  );
}
