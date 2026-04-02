"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "./actions";

const initialState: ForgotPasswordState = { ok: false };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Forgot password</h1>
        <p className="text-sm text-zinc-300">
          Enter your email and we&apos;ll send you a reset link.
        </p>
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

      <form action={formAction} className="space-y-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          disabled={isPending}
        />

        <button
          type="submit"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div className="text-xs text-zinc-400">
        <Link className="hover:text-white" href="/signin">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
