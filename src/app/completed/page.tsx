import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskList } from "@/components/tasks/TaskList";
import { getCompletedTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function CompletedPage() {
  const tasks = await getCompletedTasks();

  return (
    <TaskWindow title="Completed Tasks">
      {tasks.length === 0 ? (
        <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          No completed tasks.
        </div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </TaskWindow>
  );
}
