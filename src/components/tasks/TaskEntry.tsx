import type { ReactNode } from "react";

type TaskEntryProps = {
  index: number;
  title: string;
  message?: string;
  dueDate?: Date;
  tags?: string[];
  completed?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  rightSlot?: ReactNode;
};

function formatDueDate(date: Date): string {
  return date.toLocaleDateString("fi-FI");
}

function isDueToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isOverdue(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function TaskEntry({
  index,
  title,
  message,
  dueDate,
  tags,
  completed = false,
  expanded = false,
  onToggleExpanded,
  rightSlot,
}: TaskEntryProps) {
  const backgroundClass = index % 2 === 0 ? "bg-zinc-700" : "bg-zinc-800";

  const dueDateLabel = dueDate ? formatDueDate(dueDate) : null;
  const overdue = dueDate && !completed && isOverdue(dueDate);
  const dueToday = dueDate && !completed && isDueToday(dueDate);

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 ${backgroundClass}`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-md text-gray-100">{title}</span>
          {dueDateLabel ? (
            <span
              className={`shrink-0 text-xs ${
                overdue
                  ? "text-red-400"
                  : dueToday
                  ? "text-amber-400"
                  : "text-zinc-400"
              }`}
            >
              {overdue ? "⚠ " : ""}{dueDateLabel}
            </span>
          ) : null}
        </div>
        {tags && tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {expanded && message ? (
          <div className="text-xs text-zinc-100 mt-3 whitespace-pre-wrap">
            {message}
          </div>
        ) : null}
      </button>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
