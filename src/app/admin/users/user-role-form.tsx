"use client";

import { useEffect, useState, useTransition } from "react";

import { deleteUserAction, updateUserRoleAction } from "./actions";
import type { UserRole } from "@/lib/users";

type Props = {
  userId: string;
  currentRole: UserRole;
  isCurrentUser: boolean;
};

export function UserRoleForm({ userId, currentRole, isCurrentUser }: Props) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [success]);

  function onChange(nextRole: UserRole) {
    setRole(nextRole);
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updateUserRoleAction(userId, nextRole);
        setSuccess(true);
      } catch (err) {
        setRole(currentRole);
        setError(err instanceof Error ? err.message : "Could not update role.");
      }
    });
  }

  function onDelete() {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setError(null);

    startTransition(async () => {
      try {
        await deleteUserAction(userId);
        setDeleted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete user.");
      }
    });
  }

  if (deleted) {
    return <div className="text-[11px] text-zinc-500">Deleted</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-100"
          value={role}
          disabled={isPending || isCurrentUser}
          onChange={(e) => onChange(e.target.value as UserRole)}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        {!isCurrentUser ? (
          <button
            type="button"
            className="rounded-md px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:opacity-60"
            disabled={isPending}
            onClick={onDelete}
          >
            Delete
          </button>
        ) : null}
        {success ? (
          <span className="text-[11px] text-emerald-400">Saved</span>
        ) : null}
      </div>
      {isCurrentUser ? (
        <div className="text-[11px] text-zinc-500">You cannot change your own role here.</div>
      ) : null}
      {error ? <div className="text-[11px] text-red-300">{error}</div> : null}
    </div>
  );
}