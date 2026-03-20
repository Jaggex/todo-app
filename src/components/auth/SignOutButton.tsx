"use client";

import { signOut } from "next-auth/react";

type Props = {
  className?: string;
  callbackUrl?: string;
};

export function SignOutButton({ className, callbackUrl = "/signin" }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => signOut({ callbackUrl })}
    >
      Sign out
    </button>
  );
}
