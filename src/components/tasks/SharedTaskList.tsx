"use client";

import { useState, useEffect, useTransition } from "react";

import type { Task } from "@/lib/tasks";
import { setSharedTaskCompleted, deleteSharedTask, deleteSelectedSharedTasks, updateSharedTask } from "@/actions/tasks";
import { TaskEntry } from "@/components/tasks/TaskEntry";
import { TaskEntryActions } from "@/components/tasks/TaskEntryActions";
import { TaskEditForm } from "@/components/tasks/TaskEditForm";
import type { Tag } from "@/lib/tags";

type SharedTaskListProps = {
  tasks: Task[];
  workspaceId: string;
  allTags: Tag[];
};

export function SharedTaskList({ tasks, workspaceId, allTags }: SharedTaskListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [optimisticTasks, setOptimisticTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

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
        await deleteSelectedSharedTasks(ids, workspaceId);
      } catch {
        setOptimisticTasks(previous);
      }
    });
  }

  function handleCompletedChange(taskId: string, completed: boolean) {
    startTransition(async () => {
      await setSharedTaskCompleted(taskId, workspaceId, completed);
    });
  }

  function handleDelete(taskId: string) {
    const previous = optimisticTasks;
    setOptimisticTasks((current) => current.filter((t) => t.id !== taskId));
    setSelectedIds((current) => { const next = new Set(current); next.delete(taskId); return next; });
    startTransition(async () => {
      try {
        await deleteSharedTask(taskId, workspaceId);
      } catch {
        setOptimisticTasks(previous);
      }
    });
  }

  const allSelected = optimisticTasks.length > 0 && selectedIds.size === optimisticTasks.length;

  if (optimisticTasks.length === 0) {
    return (
      <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
        No shared tasks.
      </div>
    );
  }

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
      <div className="space-y-1">
        {optimisticTasks.map((task, index) =>
          editingTaskId === task.id ? (
            <div
              key={task.id}
              className={`rounded-xl p-4 ${index % 2 === 0 ? "bg-zinc-700" : "bg-zinc-800"}`}
            >
              <TaskEditForm
                taskId={task.id}
                initialTitle={task.title}
                initialMessage={task.message}
                initialDueDate={task.dueDate}
                initialTags={task.tags}
                allTags={allTags}
                bgVariant={index % 2 === 0 ? "zinc-700" : "zinc-800"}
                onCancel={() => setEditingTaskId(null)}
                updateFn={(taskId, title, message, dueDate, tags) =>
                  updateSharedTask(taskId, workspaceId, title, message, dueDate, tags)
                }
              />
            </div>
          ) : (
            <div key={task.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.has(task.id)}
                onChange={(e) =>
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    if (e.target.checked) next.add(task.id);
                    else next.delete(task.id);
                    return next;
                  })
                }
                className="h-4 w-4 accent-zinc-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <TaskEntry
                  index={index}
                  title={task.title}
                  message={task.message}
                  dueDate={task.dueDate}
                  tags={task.tags}
                  completed={task.completed}
                  expanded={expandedId === task.id}
                  onToggleExpanded={() =>
                    setExpandedId((prev) => (prev === task.id ? null : task.id))
                  }
                  rightSlot={
                    <TaskEntryActions
                      completed={task.completed}
                      onCompletedChange={(completed) =>
                        handleCompletedChange(task.id, completed)
                      }
                      onDelete={() => handleDelete(task.id)}
                      onEdit={() => setEditingTaskId(task.id)}
                    />
                  }
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
