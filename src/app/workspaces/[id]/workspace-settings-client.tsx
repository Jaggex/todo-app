"use client";

import { useState, useTransition } from "react";

import { sendInviteAction, revokeInviteAction, removeMemberAction, leaveWorkspaceAction } from "@/actions/workspaces";
import type { WorkspaceMember, WorkspaceInvite } from "@/lib/workspaces";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Invite section (email-based)
// ---------------------------------------------------------------------------

export function InviteSection({
  workspaceId,
  workspaceName,
  baseUrl,
  pendingInvites,
}: {
  workspaceId: string;
  workspaceName: string;
  baseUrl: string;
  pendingInvites: WorkspaceInvite[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleInvite() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await sendInviteAction(workspaceId, email, workspaceName, baseUrl);
      if (result.ok) {
        setEmail("");
        setShowInput(false);
        setSuccess("Invite sent.");
        router.refresh();
      } else {
        setError(result.message ?? "Failed to send invite.");
      }
    });
  }

  function handleRevoke(inviteId: string, recipientEmail: string) {
    if (!window.confirm(`Revoke invite sent to ${recipientEmail}?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await revokeInviteAction(workspaceId, inviteId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message ?? "Failed to revoke invite.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Invitations</h2>
        {!showInput && (
          <button
            type="button"
            onClick={() => { setShowInput(true); setSuccess(null); setError(null); }}
            className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-neutral-100 hover:text-black"
          >
            Invite user
          </button>
        )}
      </div>

      {showInput && (
        <div className="rounded-xl bg-zinc-800 p-4 space-y-3">
          <p className="text-xs text-zinc-400">Enter the email address of the person you want to invite.</p>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoFocus
              disabled={isPending}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); if (e.key === "Escape") setShowInput(false); }}
              className="flex-1 rounded-md bg-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={isPending || !email.trim()}
              className="rounded-md bg-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="text-xs text-zinc-400 hover:text-red-400"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {success && !showInput && (
        <p className="text-xs text-green-400">{success}</p>
      )}

      {pendingInvites.length > 0 && (
        <div className="rounded-xl bg-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Sent to</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Sent at</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Expires</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {pendingInvites.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5 text-xs text-white">{inv.email}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">
                    {new Date(inv.createdAt).toLocaleDateString("fi-FI")}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">
                    {new Date(inv.expiresAt).toLocaleDateString("fi-FI")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id, inv.email)}
                      disabled={isPending}
                      className="text-xs text-zinc-500 hover:text-red-400 disabled:opacity-60"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingInvites.length === 0 && !showInput && (
        <p className="text-xs text-zinc-500">No pending invitations.</p>
      )}
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
