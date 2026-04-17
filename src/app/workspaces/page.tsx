import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getWorkspacesByUserId } from "@/lib/workspaces";
import { CreateWorkspaceForm } from "./create-workspace-form";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const workspaces = await getWorkspacesByUserId(session.user.id);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h2 className="text-2xl font-semibold text-white text-center">Workspaces</h2>

      <p className="text-sm text-zinc-400 text-center">
          Create or manage workspaces to share tasks with your team.
        </p>

      {workspaces.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-300">Your workspaces</h2>
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 hover:bg-zinc-700"
            >
              <span className="text-sm text-white">{ws.name}</span>
              <span className="text-xs text-zinc-400">Manage →</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">You are not a member of any workspace yet.</p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Create a new workspace</h2>
        <div className="rounded-xl bg-zinc-800 p-4">
          <CreateWorkspaceForm />
        </div>
      </div>
    </div>
  );
}
