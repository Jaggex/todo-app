"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = {
  ok: false,
};

export function SignUpForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.ok, state.redirectTo]);

  const backHref = callbackUrl ? `/signin?next=${encodeURIComponent(callbackUrl)}` : "/signin";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Create Worktasks account</h1>
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
        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}
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
        <Link className="hover:text-white" href={backHref}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
