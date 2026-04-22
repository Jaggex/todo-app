import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskList } from "@/components/tasks/TaskList";
import { SharedTaskList } from "@/components/tasks/SharedTaskList";
import { TaskSearch } from "@/components/tasks/TaskSearch";
import { TagFilter } from "@/components/tasks/TagFilter";
import { Pagination } from "@/components/tasks/Pagination";
import { getCompletedTasks, getSharedCompletedTasks } from "@/lib/tasks";
import { getTagsByOwner } from "@/lib/tags";
import { authOptions } from "@/lib/auth";
import { getWorkspacesByUserId } from "@/lib/workspaces";

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
  const tagsParam = typeof resolvedSearchParams?.tags === "string" ? resolvedSearchParams.tags : undefined;
  const tagFilters = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
  const rawPage = typeof resolvedSearchParams?.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const { tasks, totalPages } = await getCompletedTasks(ownerId, searchQuery, tagFilters, page);
  const [tags, workspaces] = await Promise.all([
    getTagsByOwner(ownerId),
    getWorkspacesByUserId(ownerId),
  ]);

  const workspaceIds = workspaces.map((ws) => ws.id);
  const sharedCompleted = await getSharedCompletedTasks(workspaceIds, searchQuery);

  // Group shared completed tasks by workspaceId
  const sharedByWorkspace = new Map<string, typeof sharedCompleted>();
  for (const task of sharedCompleted) {
    if (!task.workspaceId) continue;
    if (!sharedByWorkspace.has(task.workspaceId)) {
      sharedByWorkspace.set(task.workspaceId, []);
    }
    sharedByWorkspace.get(task.workspaceId)!.push(task);
  }

  const paginationParams: Record<string, string> = {};
  if (searchQuery) paginationParams.q = searchQuery;
  if (tagsParam) paginationParams.tags = tagsParam;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-semibold text-white text-center">Completed tasks</h2>

      <div className="flex items-center gap-3">
        <TaskSearch basePath="/completed" className="w-64" />
      </div>

      <TaskWindow title="Personal tasks">
      <div className="space-y-3">
        <TagFilter tags={tags} basePath="/completed" />
        {tasks.length === 0 ? (
          <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            {searchQuery ? "No tasks match your search." : "No completed tasks."}
          </div>
        ) : (
          <>
            <TaskList tasks={tasks} />
            <Pagination page={page} totalPages={totalPages} basePath="/completed" searchParams={paginationParams} />
          </>
        )}
      </div>
      </TaskWindow>

      {workspaces.map((ws) => {
        const wsTasks = sharedByWorkspace.get(ws.id) ?? [];
        return (
          <TaskWindow key={ws.id} title={ws.name}>
            <div className="space-y-3">
              {wsTasks.length === 0 ? (
                <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                  No completed shared tasks.
                </div>
              ) : (
                <SharedTaskList tasks={wsTasks} workspaceId={ws.id} allTags={tags} />
              )}
            </div>
          </TaskWindow>
        );
      })}
    </div>
  );
}
