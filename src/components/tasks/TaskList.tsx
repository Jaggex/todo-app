"use client";

import { useEffect, useState, useTransition } from "react";

import type { Task } from "@/lib/tasks";
import { deleteSelectedTasks, deleteTask, setTaskCompleted } from "@/actions/tasks";
import { TaskEntry } from "@/components/tasks/TaskEntry";
import { TaskEntryActions } from "@/components/tasks/TaskEntryActions";

type TaskListProps = {
  tasks: Task[];
};

export function TaskList({ tasks }: TaskListProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setOptimisticTasks(tasks);

    setExpandedIds((current) => {
      const next = new Set<string>();
      for (const task of tasks) {
        if (current.has(task.id)) next.add(task.id);
      }
      return next;
    });

    setSelectedIds((current) => {
      const next = new Set<string>();
      for (const task of tasks) {
        if (current.has(task.id)) next.add(task.id);
      }
      return next;
    });
  }, [tasks]);

  function toggleExpanded(taskId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleSelected(taskId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === optimisticTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(optimisticTasks.map((t) => t.id)));
    }
  }

  function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const previous = optimisticTasks;
    setOptimisticTasks((current) => current.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());

    startTransition(async () => {
      try {
        await deleteSelectedTasks(ids);
      } catch (error) {
        console.error("Bulk delete failed", error);
        setOptimisticTasks(previous);
      }
    });
  }

  function handleCompletedChange(taskId: string, completed: boolean) {
    const previous = optimisticTasks;
    setOptimisticTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );

    startTransition(async () => {
      try {
        await setTaskCompleted(taskId, completed);
      } catch (error) {
        console.error("Set completed failed", error);
        setOptimisticTasks(previous);
      }
    });
  }

  function handleDelete(taskId: string) {
    const previous = optimisticTasks;
    setOptimisticTasks((current) => current.filter((t) => t.id !== taskId));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(taskId);
      return next;
    });

    startTransition(async () => {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error("Delete failed", error);
        setOptimisticTasks(previous);
      }
    });
  }

  const allSelected = optimisticTasks.length > 0 && selectedIds.size === optimisticTasks.length;

  return (
    <div className={isPending ? "opacity-70" : undefined}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          className="rounded-md bg-zinc-800 px-1 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
        {selectedIds.size > 0 ? (
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isPending}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-700 hover:text-red-300 disabled:opacity-60"
          >
            Delete selected ({selectedIds.size})
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        {optimisticTasks.map((task, index) => (
          <div key={task.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.has(task.id)}
              onChange={() => toggleSelected(task.id)}
              className="h-4 w-4 shrink-0 accent-zinc-200"
            />
            <div className="min-w-0 flex-1">
              <TaskEntry
                index={index}
                title={task.title}
                message={task.message}
                dueDate={task.dueDate}
                tags={task.tags}
                completed={task.completed}
                expanded={expandedIds.has(task.id)}
                onToggleExpanded={() => toggleExpanded(task.id)}
                rightSlot={
                  <TaskEntryActions
                    completed={task.completed}
                    onCompletedChange={(completed) =>
                      handleCompletedChange(task.id, completed)
                    }
                    onDelete={() => handleDelete(task.id)}
                  />
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
