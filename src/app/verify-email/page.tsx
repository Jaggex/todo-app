import Link from "next/link";

import { verifyEmail } from "@/lib/users";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  let success = false;
  let message = "Invalid or missing verification token.";

  if (token) {
    success = await verifyEmail(token);
    message = success
      ? "Email verified! You can now sign in."
      : "Invalid or expired verification link.";
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold text-white">Email verification</h1>

      <div
        className={`rounded-md px-3 py-2 text-sm ${
          success
            ? "bg-emerald-950 text-emerald-200"
            : "bg-zinc-900 text-red-300"
        }`}
      >
        {message}
      </div>

      <div className="text-xs text-zinc-400">
        <Link className="hover:text-white" href="/signin">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
