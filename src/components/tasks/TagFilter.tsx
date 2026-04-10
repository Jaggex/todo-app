"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { Tag } from "@/lib/tags";

type TagFilterProps = {
  tags: Tag[];
  basePath: string;
};

export function TagFilter({ tags, basePath }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get("tags") ?? "";
  const activeTags = tagsParam ? tagsParam.split(",") : [];

  if (tags.length === 0) return null;

  function handleClick(tagName: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = activeTags.includes(tagName)
      ? activeTags.filter((t) => t !== tagName)
      : [...activeTags, tagName];
    if (next.length > 0) {
      params.set("tags", next.join(","));
    } else {
      params.delete("tags");
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function handleClear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-zinc-500">Filter:</span>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => handleClick(tag.name)}
          className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
            activeTags.includes(tag.name)
              ? "bg-zinc-200 text-zinc-900"
              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          }`}
        >
          {tag.name}
        </button>
      ))}
      {activeTags.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
