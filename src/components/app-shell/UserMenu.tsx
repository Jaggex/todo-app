"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { UserRole } from "@/lib/users";
import { SignOutButton } from "@/components/auth/SignOutButton";

type Props = {
  email: string;
  role: UserRole;
};

export function UserMenu({ email, role }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex items-center justify-end gap-3">
      <div className="max-w-[8rem] truncate text-right text-xs text-white">{email}</div>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Open user menu"
        className="rounded-md bg-zinc-800 px-3 py-2 text-zinc-300 transition hover:bg-zinc-100 hover:text-black"
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 fill-current"
        >
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>

      {isOpen ? (
        <button
          type="button"
          aria-label="Close user menu overlay"
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div
        className={[
          "fixed right-4 top-16 z-20 w-56 rounded-lg border border-dashed border-gray-200 bg-zinc-900 p-2 shadow-lg transition-transform transition-opacity duration-200",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0",
        ].join(" ")}
      >
        <div className="border-b border-dashed border-gray-200 px-2 pb-2 text-[11px] text-zinc-400">
          {email}
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <Link
            className="block rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-100 hover:text-black"
            href="/account"
            onClick={() => setIsOpen(false)}
          >
            Account
          </Link>

          {role === "admin" ? (
            <Link
              className="block rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-100 hover:text-black"
              href="/admin/users"
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
          ) : null}

          <SignOutButton
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-100 hover:text-black"
            callbackUrl="/signin"
          />
        </div>
      </div>
    </div>
  );
}