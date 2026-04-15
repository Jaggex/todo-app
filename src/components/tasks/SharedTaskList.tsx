"use client";

import { useState, useTransition } from "react";

import type { Task } from "@/lib/tasks";
import { setSharedTaskCompleted, deleteSharedTask } from "@/actions/tasks";
import { TaskEntry } from "@/components/tasks/TaskEntry";
import { TaskEntryActions } from "@/components/tasks/TaskEntryActions";

type SharedTaskListProps = {
  tasks: Task[];
  workspaceId: string;
};

export function SharedTaskList({ tasks, workspaceId }: SharedTaskListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleCompletedChange(taskId: string, completed: boolean) {
    startTransition(async () => {
      await setSharedTaskCompleted(taskId, workspaceId, completed);
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteSharedTask(taskId, workspaceId);
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
        No shared tasks.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task, index) => (
        <TaskEntry
          key={task.id}
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
            />
          }
        />
      ))}
    </div>
  );
}
