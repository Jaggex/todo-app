import Link from "next/link";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskListDnd } from "@/components/tasks/TaskListDnd";
import { getPendingTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isNewOpen = resolvedSearchParams?.new === "1";
  const tasks = await getPendingTasks();

  return (
    <div className="space-y-3">
      {isNewOpen ? <TaskForm /> : null}

      <TaskWindow
        title="Pending Tasks"
        rightSlot={
          <Link
            className="rounded-md px-3 py-3 text-sm text-gray-300 bg-zinc-900 hover:bg-neutral-100 hover:text-black"
            href={isNewOpen ? "/" : "/?new=1"}
          >
            {isNewOpen ? "Close" : "New task"}
          </Link>
        }
      >
        <TaskListDnd tasks={tasks} />
      </TaskWindow>
    </div>
  );
}
