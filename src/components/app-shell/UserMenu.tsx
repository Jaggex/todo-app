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
    <div ref={containerRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Open user menu"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-zinc-800"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-zinc-200">
          {email[0].toUpperCase()}
        </div>
        <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{email}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 shrink-0 fill-current text-zinc-500"
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
          "fixed left-4 bottom-16 z-20 w-56 rounded-lg border border-dashed border-gray-200 bg-zinc-900 p-2 shadow-lg transition-all duration-200",
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0",
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