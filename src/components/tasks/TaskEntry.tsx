import type { ReactNode } from "react";

type TaskEntryProps = {
  index: number;
  title: string;
  message?: string;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  rightSlot?: ReactNode;
};

export function TaskEntry({
  index,
  title,
  message,
  expanded = false,
  onToggleExpanded,
  rightSlot,
}: TaskEntryProps) {
  const backgroundClass = index % 2 === 0 ? "bg-zinc-700" : "bg-zinc-800";

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 ${backgroundClass}`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        className="min-w-0 flex-1 text-left"
      >
        <div className="text-sm text-gray-100">{title}</div>
        {expanded && message ? (
          <div className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap">
            {message}
          </div>
        ) : null}
      </button>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
