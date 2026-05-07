"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import type { UserRole } from "@/lib/users";
import { SignOutButton } from "@/components/auth/SignOutButton";

const navItems = [
  { href: "/", label: "Pending" },
  { href: "/completed", label: "Completed" },
  { href: "/workspaces", label: "Workspaces" },
];

type Props = {
  email?: string;
  role?: UserRole;
};

export function MobileMenu({ email, role }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800 transition"
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? (
          // X icon
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        ) : (
          // Hamburger icon
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M3 5h14a1 1 0 000-2H3a1 1 0 000 2zm0 6h14a1 1 0 000-2H3a1 1 0 000 2zm0 6h14a1 1 0 000-2H3a1 1 0 000 2z" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      {/* Drawer */}
      <div
        className={[
          "fixed top-14 left-0 bottom-0 z-40 w-64 bg-zinc-900 border-r border-dashed border-gray-200 flex flex-col transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {email ? (
          <>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 mb-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-zinc-200">
                  {email[0].toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{email}</span>
              </div>
              <Link
                href="/account"
                className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-neutral-100 hover:text-black"
                onClick={() => setIsOpen(false)}
              >
                Account
              </Link>
              {role === "admin" ? (
                <Link
                  href="/admin/users"
                  className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-neutral-100 hover:text-black"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              ) : null}
              <SignOutButton
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-300 hover:bg-neutral-100 hover:text-black"
                callbackUrl="/signin"
              />
            </div>
          </>
        ) : (
          <div className="p-4">
            <Link
              href="/signin"
              className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-neutral-100 hover:text-black"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
