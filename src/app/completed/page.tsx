import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskEntry } from "@/components/tasks/TaskEntry";
import { getCompletedTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function CompletedPage() {
  const tasks = await getCompletedTasks();

  return (
    <TaskWindow title="Completed tasks">
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <TaskEntry
            key={task.id}
            index={index}
            text={task.title}
          />
        ))}
      </div>
    </TaskWindow>
  );
}
