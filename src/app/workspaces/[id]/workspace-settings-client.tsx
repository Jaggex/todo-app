"use client";

import { useState, useTransition } from "react";

import { generateInviteAction, revokeInviteAction, removeMemberAction, leaveWorkspaceAction } from "@/actions/workspaces";
import type { WorkspaceMember, WorkspaceInvite } from "@/lib/workspaces";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Invite link generator
// ---------------------------------------------------------------------------

export function InviteLinkSection({
  workspaceId,
  baseUrl,
  existingInvites,
}: {
  workspaceId: string;
  baseUrl: string;
  existingInvites: WorkspaceInvite[];
}) {
  const [isPending, startTransition] = useTransition();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const activeToken = generatedToken ?? existingInvites[0]?.token ?? null;
  const inviteUrl = activeToken ? `${baseUrl}/join/${activeToken}` : null;

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateInviteAction(workspaceId);
      if (result.ok && result.inviteToken) {
        setGeneratedToken(result.inviteToken);
        router.refresh();
      } else {
        setError(result.message ?? "Failed to generate link.");
      }
    });
  }

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRevoke(inviteId: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeInviteAction(workspaceId, inviteId);
      if (result.ok) {
        setGeneratedToken(null);
        router.refresh();
      } else {
        setError(result.message ?? "Failed to revoke.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-zinc-300">Invite link</h2>

      {inviteUrl ? (
        <div className="rounded-xl bg-zinc-800 p-4 space-y-2">
          <p className="break-all rounded-md bg-zinc-700 px-3 py-2 text-xs text-zinc-300 font-mono select-all">
            {inviteUrl}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={isPending}
              className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending}
              className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-60"
            >
              {isPending ? "…" : "New link"}
            </button>
            {existingInvites[0] ? (
              <button
                type="button"
                onClick={() => handleRevoke(existingInvites[0].id)}
                disabled={isPending}
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 disabled:opacity-60"
              >
                Revoke
              </button>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">
            Expires {existingInvites[0] ? new Date(existingInvites[0].expiresAt).toLocaleDateString("fi-FI") : "soon"}. Share this link with teammates.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-800 p-4">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="rounded-md bg-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
          >
            {isPending ? "Generating…" : "Generate invite link"}
          </button>
        </div>
      )}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member list
// ---------------------------------------------------------------------------

export function MemberList({
  workspaceId,
  members,
  memberEmails,
  currentUserId,
  currentUserRole,
}: {
  workspaceId: string;
  members: WorkspaceMember[];
  memberEmails: Record<string, string>;
  currentUserId: string;
  currentUserRole: "owner" | "member";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleRemove(userId: string) {
    if (!window.confirm("Remove this member from the workspace?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, userId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message ?? "Failed to remove member.");
      }
    });
  }

  function handleLeave() {
    if (!window.confirm("Leave this workspace?")) return;
    setError(null);
    startTransition(async () => {
      const result = await leaveWorkspaceAction(workspaceId);
      if (result.ok) {
        router.push("/workspaces");
      } else {
        setError(result.message ?? "Failed to leave.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-zinc-300">Members</h2>
      <div className="rounded-xl bg-zinc-800 divide-y divide-zinc-700">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-white">{memberEmails[m.userId] ?? m.userId}</p>
              <p className="text-xs text-zinc-400 capitalize">{m.role}</p>
            </div>
            <div className="flex items-center gap-2">
              {m.userId === currentUserId ? (
                currentUserRole !== "owner" ? (
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={isPending}
                    className="rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-red-400 disabled:opacity-60"
                  >
                    Leave
                  </button>
                ) : (
                  <span className="text-xs text-zinc-600">You (owner)</span>
                )
              ) : currentUserRole === "owner" ? (
                <button
                  type="button"
                  onClick={() => handleRemove(m.userId)}
                  disabled={isPending}
                  className="rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-red-400 disabled:opacity-60"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
