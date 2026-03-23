"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.href = "/";
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Sign in</h1>
        <p className="text-sm text-zinc-300">
          Sign in with an account stored in MongoDB.
        </p>
      </div>

      {error ? (
        <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <Link className="hover:text-white" href="/signup">
          Create account
        </Link>
        <Link className="hover:text-white" href="/">
          Back
        </Link>
      </div>
    </div>
  );
}
