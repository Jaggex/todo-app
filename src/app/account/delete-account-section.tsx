"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { deleteAccountAction, type DeleteAccountState } from "./actions";

const initialState: DeleteAccountState = { ok: false };

export function DeleteAccountSection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialState
  );

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      signOut({ callbackUrl: state.redirectTo });
    }
  }, [state, router]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-red-400">Delete account</h2>
        <p className="text-sm text-zinc-400">
          Permanently delete your account and all associated data. This cannot be
          undone.
        </p>
      </div>

      {!expanded ? (
        <button
          type="button"
          className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300 transition hover:bg-red-900"
          onClick={() => setExpanded(true)}
        >
          I want to delete my account
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-dashed border-red-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">
            Enter your password to confirm account deletion.
          </p>

          {state.message ? (
            <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-red-300">
              {state.message}
            </div>
          ) : null}

          <form action={formAction} className="space-y-3">
            <input
              name="password"
              type="password"
              placeholder="Your password"
              className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
              required
              disabled={isPending}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-red-800 px-3 py-2 text-sm text-white transition hover:bg-red-700 disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete my account"}
              </button>
              <button
                type="button"
                className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
                onClick={() => setExpanded(false)}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
