import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskSearch } from "@/components/tasks/TaskSearch";
import { TagFilter } from "@/components/tasks/TagFilter";
import { Pagination } from "@/components/tasks/Pagination";
import { getCompletedTasks } from "@/lib/tasks";
import { getTagsByOwner } from "@/lib/tags";
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
  const tagsParam = typeof resolvedSearchParams?.tags === "string" ? resolvedSearchParams.tags : undefined;
  const tagFilters = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
  const rawPage = typeof resolvedSearchParams?.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const { tasks, totalPages } = await getCompletedTasks(ownerId, searchQuery, tagFilters, page);
  const tags = await getTagsByOwner(ownerId);

  const paginationParams: Record<string, string> = {};
  if (searchQuery) paginationParams.q = searchQuery;
  if (tagsParam) paginationParams.tags = tagsParam;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-semibold text-white text-center">Completed tasks</h2>

      <TaskWindow>
      <div className="space-y-3">
        <TaskSearch basePath="/completed" />
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
    </div>
  );
}
