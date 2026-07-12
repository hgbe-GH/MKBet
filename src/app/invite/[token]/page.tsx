import { getAuthClaims } from "@/auth/get-auth-claims";
import { acceptInvitationAction } from "@/application/invitations/actions";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import { getInvitationPreview } from "@/data/supabase/invitations/repository";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const preview = await getInvitationPreview(token);
  const claims = await getAuthClaims();
  const nextPath = `/invite/${encodeURIComponent(token)}`;

  return (
    <main className="grid min-h-screen place-items-center bg-stone-100 px-5 py-12 text-stone-950">
      <div className="w-full max-w-xl">
        <InvitationPanel
          action={acceptInvitationAction}
          isAuthenticated={Boolean(claims)}
          nextPath={nextPath}
          preview={preview}
          token={token}
        />
      </div>
    </main>
  );
}
