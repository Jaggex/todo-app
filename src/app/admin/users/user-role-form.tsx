"use client";

import { useState, useTransition } from "react";

import { updateUserRoleAction } from "./actions";
import type { UserRole } from "@/lib/users";

type Props = {
  userId: string;
  currentRole: UserRole;
  isCurrentUser: boolean;
};

export function UserRoleForm({ userId, currentRole, isCurrentUser }: Props) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onChange(nextRole: UserRole) {
    setRole(nextRole);
    setError(null);

    startTransition(async () => {
      try {
        await updateUserRoleAction(userId, nextRole);
      } catch (err) {
        setRole(currentRole);
        setError(err instanceof Error ? err.message : "Could not update role.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <select
        className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-100"
        value={role}
        disabled={isPending || isCurrentUser}
        onChange={(e) => onChange(e.target.value as UserRole)}
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      {isCurrentUser ? (
        <div className="text-[11px] text-zinc-500">You cannot change your own role here.</div>
      ) : null}
      {error ? <div className="text-[11px] text-red-300">{error}</div> : null}
    </div>
  );
}