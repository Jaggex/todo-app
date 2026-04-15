import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getInviteByToken, getWorkspaceById } from "@/lib/workspaces";
import { JoinButton } from "./join-button";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/join/${token}`);
  }

  const invite = await getInviteByToken(token);

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-sm space-y-4 pt-16 text-center">
        <h1 className="text-xl font-semibold text-white">Invalid invite</h1>
        <p className="text-sm text-zinc-400">
          This invite link is invalid or has expired. Ask a workspace owner for a new link.
        </p>
      </div>
    );
  }

  const workspace = await getWorkspaceById(invite.workspaceId);

  if (!workspace) {
    return (
      <div className="mx-auto max-w-sm space-y-4 pt-16 text-center">
        <h1 className="text-xl font-semibold text-white">Workspace not found</h1>
        <p className="text-sm text-zinc-400">This workspace no longer exists.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-16 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-white">You've been invited</h1>
        <p className="text-sm text-zinc-400">
          Join <span className="text-white font-medium">{workspace.name}</span> to collaborate on shared tasks.
        </p>
      </div>

      <div className="rounded-xl bg-zinc-800 px-6 py-5 space-y-4">
        <p className="text-sm text-zinc-300">
          Signed in as <span className="text-white">{session.user.email}</span>
        </p>
        <JoinButton token={token} />
      </div>
    </div>
  );
}
