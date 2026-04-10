"use client";

import { useEffect, useState, useTransition } from "react";

import type { Task } from "@/lib/tasks";
import { deleteTask, setTaskCompleted } from "@/actions/tasks";
import { TaskEntry } from "@/components/tasks/TaskEntry";
import { TaskEntryActions } from "@/components/tasks/TaskEntryActions";

type TaskListProps = {
  tasks: Task[];
};

export function TaskList({ tasks }: TaskListProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setOptimisticTasks(tasks);

    setExpandedIds((current) => {
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

    startTransition(async () => {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error("Delete failed", error);
        setOptimisticTasks(previous);
      }
    });
  }

  return (
    <div className={isPending ? "opacity-70" : undefined}>
      <div className="space-y-2">
        {optimisticTasks.map((task, index) => (
          <TaskEntry
            key={task.id}
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
        ))}
      </div>
    </div>
  );
}
