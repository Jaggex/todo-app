import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getWorkspaceById,
  getWorkspaceMembers,
  getWorkspaceMembership,
  getActiveInvitesForWorkspace,
} from "@/lib/workspaces";
import { getUsersByIds } from "@/lib/users";
import { InviteSection, MemberList, WorkspaceDangerZone } from "./workspace-settings-client";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;
  const [workspace, membership] = await Promise.all([
    getWorkspaceById(id),
    getWorkspaceMembership(id, session.user.id),
  ]);

  if (!workspace || !membership) {
    notFound();
  }

  const [members, invites] = await Promise.all([
    getWorkspaceMembers(id),
    membership.role === "owner" ? getActiveInvitesForWorkspace(id) : Promise.resolve([]),
  ]);

  const users = await getUsersByIds(members.map((m) => m.userId));
  const memberEmails: Record<string, string> = {};
  for (const u of users) {
    memberEmails[u.id] = u.email;
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Workspace</p>
        <h1 className="text-xl font-semibold text-white">{workspace.name}</h1>
      </div>

      <MemberList
        workspaceId={id}
        members={members}
        memberEmails={memberEmails}
        currentUserId={session.user.id}
        currentUserRole={membership.role}
      />

      {membership.role === "owner" ? (
        <InviteSection
          workspaceId={id}
          workspaceName={workspace.name}
          baseUrl={baseUrl}
          pendingInvites={invites}
        />
      ) : null}

      {membership.role === "owner" ? (
        <WorkspaceDangerZone workspaceId={id} workspaceName={workspace.name} />
      ) : null}
    </div>
  );
}
