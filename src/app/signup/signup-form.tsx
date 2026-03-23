"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = {
  ok: false,
};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-zinc-300">
          Create a Mongo-backed user account for this workspace.
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
          name="email"
          type="email"
          placeholder="Email"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          disabled={isPending}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          minLength={8}
          disabled={isPending}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
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
          {isPending ? "Creating account…" : "Create account"}
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
