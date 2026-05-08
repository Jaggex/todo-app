"use client";

import { signOut } from "next-auth/react";

type Props = {
  className?: string;
};

export function SignOutButton({ className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await signOut({ redirect: false });
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
