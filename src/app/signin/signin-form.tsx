"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { resendVerificationAction, type ResendState } from "./actions";

const resendInitial: ResendState = { ok: false };

export function SignInForm({ callbackUrl, accountCreated }: { callbackUrl: string; accountCreated: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [resendState, resendAction, isResending] = useActionState(
    resendVerificationAction,
    resendInitial
  );

  const [showEmailHint, setShowEmailHint] = useState(false);
  const [hintEmail, setHintEmail] = useState("");

  useEffect(() => {
    if (!accountCreated) return;
    const timer = setTimeout(() => setShowEmailHint(true), 20000);
    return () => clearTimeout(timer);
  }, [accountCreated]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        if (result?.error === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
          setError("Please verify your email before signing in.");
        } else {
          setError("Invalid email or password.");
        }
        return;
      }

      window.location.href = callbackUrl;
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Sign in</h1>
        <p className="text-sm text-zinc-300">
          Sign in or create account
        </p>
      </div>

      {accountCreated ? (
        <div className="rounded-md bg-emerald-950 px-3 py-2 text-sm text-emerald-200">
          Account created. Check your email for a verification link, then sign in.
          {showEmailHint ? (
            <>
              <br /><br />
              <span className="text-emerald-300">Can&apos;t find it? Check your spam/trash folder.</span>
              <br /><br />
              {resendState.message ? (
                <span className={resendState.ok ? "text-emerald-300" : "text-red-300"}>
                  {resendState.message}
                </span>
              ) : (
                <form action={(fd) => { fd.set("email", hintEmail || email); resendAction(fd); }}>
                  <input type="hidden" name="email" value={hintEmail || email} />
                  <button
                    type="submit"
                    className="mt-1 underline underline-offset-2 hover:text-white disabled:opacity-60"
                    disabled={isResending}
                  >
                    {isResending ? "Sending…" : "Resend verification email"}
                  </button>
                </form>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {needsVerification ? (
        <div className="space-y-2">
          {resendState.message ? (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                resendState.ok
                  ? "bg-emerald-950 text-emerald-200"
                  : "bg-zinc-900 text-red-300"
              }`}
            >
              {resendState.message}
            </div>
          ) : null}
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
              disabled={isResending}
            >
              {isResending ? "Sending…" : "Resend verification email"}
            </button>
          </form>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setHintEmail(e.target.value); }}
          type="email"
          placeholder="Email"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          disabled={isPending}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
          required
          disabled={isPending}
        />

        <button
          type="submit"
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <Link className="hover:text-white" href={`/signup${callbackUrl !== "/" ? `?next=${encodeURIComponent(callbackUrl)}` : ""}`}>
          Create account
        </Link>
        <Link className="hover:text-white" href="/forgot-password">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
