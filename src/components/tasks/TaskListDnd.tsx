"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Task } from "@/lib/tasks";
import { TaskEntry } from "@/components/tasks/TaskEntry";
import { TaskEntryActions } from "@/components/tasks/TaskEntryActions";
import { deleteTask, reorderPendingTasks, setTaskCompleted } from "@/actions/tasks";

type TaskListDndProps = {
  tasks: Task[];
};

export function TaskListDnd({ tasks }: TaskListDndProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const ids = useMemo(() => optimisticTasks.map((t) => t.id), [optimisticTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;

    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = optimisticTasks;
    const next = arrayMove(previous, oldIndex, newIndex);

    setOptimisticTasks(next);

    startTransition(async () => {
      try {
        await reorderPendingTasks(next.map((t) => t.id));
      } catch (error) {
        console.error("Reorder failed", error);
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
      {mounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {optimisticTasks.map((task, index) => (
                <SortableTaskEntry key={task.id} taskId={task.id}>
                  <TaskEntry
                    index={index}
                    title={task.title}
                    message={task.message}
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
                </SortableTaskEntry>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {optimisticTasks.map((task, index) => (
            <TaskEntry
              key={task.id}
              index={index}
              title={task.title}
              message={task.message}
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
      )}
    </div>
  );
}

function SortableTaskEntry({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
