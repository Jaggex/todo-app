"use client";

type TaskEntryActionsProps = {
  completed: boolean;
  onCompletedChange: (completed: boolean) => void;
  onDelete: () => void;
};

export function TaskEntryActions({
  completed,
  onCompletedChange,
  onDelete,
}: TaskEntryActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        className="flex items-center gap-2 text-xs text-zinc-300"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => onCompletedChange(e.target.checked)}
          className="h-4 w-4 accent-zinc-200"
          onPointerDown={(e) => e.stopPropagation()}
        />
        Complete
      </label>

      <button
        type="button"
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-neutral-100 hover:text-black"
      >
        Delete
      </button>
    </div>
  );
}
