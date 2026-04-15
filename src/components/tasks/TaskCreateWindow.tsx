import type { Tag } from "@/lib/tags";
import type { Workspace } from "@/lib/workspaces";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskForm } from "@/components/tasks/TaskForm";

type TaskCreateWindowProps = {
  tags: Tag[];
  workspaces?: Workspace[];
};

export function TaskCreateWindow({ tags, workspaces }: TaskCreateWindowProps) {
  return (
    <TaskWindow title="Create new task">
      <TaskForm tags={tags} workspaces={workspaces} />
    </TaskWindow>
  );
}
