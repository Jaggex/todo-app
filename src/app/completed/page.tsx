import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskList } from "@/components/tasks/TaskList";
import { getCompletedTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function CompletedPage() {
  const tasks = await getCompletedTasks();

  return (
    <TaskWindow title="Completed Tasks">
      <TaskList tasks={tasks} />
    </TaskWindow>
  );
}
