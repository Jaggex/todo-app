import type { Tag } from "@/lib/tags";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskForm } from "@/components/tasks/TaskForm";

type TaskCreateWindowProps = {
  tags: Tag[];
};

export function TaskCreateWindow({ tags }: TaskCreateWindowProps) {
  return (
    <TaskWindow title="Create new task">
      <TaskForm tags={tags} />
    </TaskWindow>
  );
}
