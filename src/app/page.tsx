import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskCreateWindow } from "@/components/tasks/TaskCreateWindow";
import { TaskListDnd } from "@/components/tasks/TaskListDnd";
import { SharedTaskList } from "@/components/tasks/SharedTaskList";
import { TaskSearch } from "@/components/tasks/TaskSearch";
import { TagFilter } from "@/components/tasks/TagFilter";
import { getPendingTasks, getSharedPendingTasks } from "@/lib/tasks";
import { getTagsByOwner } from "@/lib/tags";
import { getWorkspacesByUserId } from "@/lib/workspaces";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home({
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
  const isNewOpen = resolvedSearchParams?.new === "1";
  const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;
  const tagsParam = typeof resolvedSearchParams?.tags === "string" ? resolvedSearchParams.tags : undefined;
  const tagFilters = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

  const [tasks, tags, workspaces] = await Promise.all([
    getPendingTasks(ownerId, searchQuery, tagFilters),
    getTagsByOwner(ownerId),
    getWorkspacesByUserId(ownerId),
  ]);

  const workspaceIds = workspaces.map((ws) => ws.id);
  const sharedTasks = await getSharedPendingTasks(workspaceIds, searchQuery);

  // Group shared tasks by workspaceId
  const sharedByWorkspace = new Map<string, typeof sharedTasks>();
  for (const task of sharedTasks) {
    if (!task.workspaceId) continue;
    if (!sharedByWorkspace.has(task.workspaceId)) {
      sharedByWorkspace.set(task.workspaceId, []);
    }
    sharedByWorkspace.get(task.workspaceId)!.push(task);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-3xl font-semibold text-white text-center">Pending tasks</h2>

      <div className="flex items-center gap-3">
        <Link
          className="rounded-md px-3 py-2 text-sm text-gray-300 bg-zinc-800 hover:bg-neutral-100 hover:text-black shrink-0"
          href={isNewOpen ? "/" : "/?new=1"}
        >
          {isNewOpen ? "Close" : "New task"}
        </Link>
        <TaskSearch basePath="/" className="w-64" />
      </div>

      {isNewOpen ? (
        <div className="mb-5">
          <TaskCreateWindow tags={tags} workspaces={workspaces} />
        </div>
      ) : null}

      <TaskWindow title="Personal Tasks">
          <div className="space-y-3">
            <TagFilter tags={tags} basePath="/" />
            {tasks.length === 0 ? (
              <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                {searchQuery ? "No tasks match your search." : "No pending tasks."}
              </div>
            ) : (
              <TaskListDnd tasks={tasks} allTags={tags} />
            )}
          </div>
        </TaskWindow>

      {workspaces.map((ws) => {
        const wsSharedTasks = sharedByWorkspace.get(ws.id) ?? [];
        return (
          <TaskWindow key={ws.id} title={`${ws.name} — Shared Tasks`}>
            <SharedTaskList tasks={wsSharedTasks} workspaceId={ws.id} allTags={tags} />
          </TaskWindow>
        );
      })}
    </div>
  );
}
