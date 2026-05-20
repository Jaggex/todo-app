"use client";

import { useEffect, useRef, useState } from "react";

type TaskEntryActionsProps = {
  completed: boolean;
  onCompletedChange?: (completed: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  completedBy?: string;
  completedAt?: Date;
};

export function TaskEntryActions({
  completed,
  onCompletedChange,
  onDelete,
  onEdit,
  completedBy,
  completedAt,
}: TaskEntryActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleDelete() {
    const ok = window.confirm("Delete this task?");
    if (!ok) return;
    setMenuOpen(false);
    onDelete();
  }

  function handleEdit() {
    setMenuOpen(false);
    onEdit?.();
  }

  const completeCheckbox = onCompletedChange ? (
    <label
      className="hidden items-center gap-2 text-xs text-zinc-300 sm:flex"
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
  ) : null;

  const completeMenuItem = onCompletedChange ? (
    <button
      type="button"
      onClick={() => {
        setMenuOpen(false);
        onCompletedChange(!completed);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full rounded-md bg-zinc-600 py-1.5 text-sm text-zinc-100 hover:bg-zinc-500 sm:hidden"
    >
      {completed ? "Mark as uncompleted" : "Mark as completed"}
    </button>
  ) : null;

  const editMenuItem = onEdit ? (
    <button
      type="button"
      onClick={handleEdit}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full rounded-md bg-zinc-600 py-1.5 text-sm text-zinc-100 hover:bg-zinc-500"
    >
      Edit
    </button>
  ) : null;

  const deleteMenuItem = (
    <button
      type="button"
      onClick={handleDelete}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full rounded-md bg-red-700 py-1.5 text-sm text-zinc-100 hover:bg-red-600"
    >
      Delete
    </button>
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {completeCheckbox}

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Task actions"
          onClick={() => setMenuOpen((open) => !open)}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <circle cx="10" cy="4" r="1.6" />
            <circle cx="10" cy="10" r="1.6" />
            <circle cx="10" cy="16" r="1.6" />
          </svg>
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-3 shadow-lg"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {completeMenuItem}
            {editMenuItem}
            {deleteMenuItem}
            {completed && completedBy ? (
              <div className="mt-2 w-full break-words text-center text-xs text-zinc-400">
                Completed by {completedBy}
                {completedAt ? ` ${completedAt.toLocaleString("fi-FI")}` : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
