import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
};

function buildHref(basePath: string, params: Record<string, string>, page: number): string {
  const p = { ...params, page: String(page) };
  const qs = new URLSearchParams(p).toString();
  return `${basePath}?${qs}`;
}

export function Pagination({ page, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <div className="flex items-center gap-1">
        {hasPrev ? (
          <Link
            href={buildHref(basePath, searchParams, page - 1)}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            ← Prev
          </Link>
        ) : (
          <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-zinc-600">← Prev</span>
        )}

        {hasNext ? (
          <Link
            href={buildHref(basePath, searchParams, page + 1)}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-zinc-600">Next →</span>
        )}
      </div>

      <span className="text-xs text-zinc-500">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
