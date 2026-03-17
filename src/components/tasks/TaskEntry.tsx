import type { ReactNode } from "react";

type TaskEntryProps = {
  index: number;
  text: string;
  textClassName?: string;
  rightSlot?: ReactNode;
};

export function TaskEntry({
  index,
  text,
  textClassName = "text-sm text-gray-100",
  rightSlot,
}: TaskEntryProps) {
  const backgroundClass = index % 2 === 0 ? "bg-zinc-700" : "bg-zinc-800";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ${backgroundClass}`}
    >
      <div className={textClassName}>{text}</div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
