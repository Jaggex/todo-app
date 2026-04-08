"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type TaskSearchProps = {
  basePath: string;
};

export function TaskSearch({ basePath }: TaskSearchProps) {
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
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tasks…"
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
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
