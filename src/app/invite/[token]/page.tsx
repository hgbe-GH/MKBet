import { getAuthClaims } from "@/auth/get-auth-claims";
import { acceptInvitationAction } from "@/application/invitations/actions";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        className="grid flex-1 place-items-center px-5 py-12"
        id="main-content"
      >
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
      <SiteFooter />
    </div>
  );
}
