"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type TaskSearchProps = {
  basePath: string;
  className?: string;
};

export function TaskSearch({ basePath, className }: TaskSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim();
      startTransition(() => {
        if (trimmed) {
          router.push(`${basePath}?q=${encodeURIComponent(trimmed)}`);
        } else {
          router.push(basePath);
        }
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, basePath, router]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tasks…"
        className="w-full rounded-md bg-zinc-800 pl-8 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-300"
      />
      {(value || isPending) ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isPending ? (
            <span className="text-xs text-zinc-500">…</span>
          ) : null}
          {value ? (
            <button
              type="button"
              onClick={() => setValue("")}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
