import Link from "next/link";
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


  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-sm space-y-6 pt-16 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">You've been invited</h1>
          <p className="text-sm text-zinc-400">
            Join <span className="text-white font-medium">{workspace.name}</span> to collaborate on shared tasks.
          </p>
        </div>
        <div className="rounded-xl bg-zinc-800 px-6 py-5 space-y-3">
          <p className="text-sm text-zinc-400">Sign in or create an account to accept this invitation.</p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/signin?next=/join/${token}`}
              className="rounded-md bg-zinc-700 px-4 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black text-center"
            >
              Sign in
            </Link>
            <Link
              href={`/signup?next=/join/${token}`}
              className="rounded-md bg-zinc-700 px-4 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black text-center"
            >
              Create account
            </Link>
          </div>
        </div>
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
