"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { ok: false };

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState
  );

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Reset password</h1>
        <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-red-300">
          Missing reset token. Use the link from your email.
        </div>
        <div className="text-xs text-zinc-400">
          <Link className="hover:text-white" href="/forgot-password">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Reset password</h1>
        <p className="text-sm text-zinc-300">Enter your new password.</p>
      </div>

      {state.message ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok
              ? "bg-emerald-950 text-emerald-200"
              : "bg-zinc-900 text-red-300"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      {state.ok ? (
        <div className="text-xs text-zinc-400">
          <Link className="hover:text-white" href="/signin">
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <input
              name="password"
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
              {isPending ? "Resetting…" : "Reset password"}
            </button>
          </form>

          <div className="text-xs text-zinc-400">
            <Link className="hover:text-white" href="/signin">
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
