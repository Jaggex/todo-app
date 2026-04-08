import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskSearch } from "@/components/tasks/TaskSearch";
import { getCompletedTasks } from "@/lib/tasks";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CompletedPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }
  const ownerId = session.user?.id;
  if (!ownerId) {
    redirect("/signin");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;
  const tasks = await getCompletedTasks(ownerId, searchQuery);

  return (
    <TaskWindow title="Completed Tasks">
      <div className="space-y-3">
        <TaskSearch basePath="/completed" />
        {tasks.length === 0 ? (
          <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            {searchQuery ? "No tasks match your search." : "No completed tasks."}
          </div>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>
    </TaskWindow>
  );
}
