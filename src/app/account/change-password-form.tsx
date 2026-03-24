"use client";

import { useActionState } from "react";

import {
  changePasswordAction,
  type ChangePasswordState,
} from "./actions";

const initialState: ChangePasswordState = {
  ok: false,
};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <p className="text-sm text-zinc-300">
          Update the password for your current account.
        </p>
      </div>

      {state.message ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok ? "bg-emerald-950 text-emerald-200" : "bg-zinc-900 text-red-300"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="space-y-3">
        <input
          name="currentPassword"
          type="password"
          placeholder="Current password"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          disabled={isPending}
        />
        <input
          name="newPassword"
          type="password"
          placeholder="New password"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          minLength={8}
          disabled={isPending}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          minLength={8}
          disabled={isPending}
        />

        <button
          type="submit"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Updating password..." : "Update password"}
        </button>
      </form>
    </div>
  );
}