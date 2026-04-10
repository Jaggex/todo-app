import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { TaskWindow } from "@/components/tasks/TaskWindow";
import { TaskCreateWindow } from "@/components/tasks/TaskCreateWindow";
import { TaskListDnd } from "@/components/tasks/TaskListDnd";
import { TaskSearch } from "@/components/tasks/TaskSearch";
import { TagFilter } from "@/components/tasks/TagFilter";
import { getPendingTasks } from "@/lib/tasks";
import { getTagsByOwner } from "@/lib/tags";
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
  const tasks = await getPendingTasks(ownerId, searchQuery, tagFilters);
  const tags = await getTagsByOwner(ownerId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <Link
          className="rounded-md px-3 py-2 text-sm text-gray-300 bg-zinc-800 hover:bg-neutral-100 hover:text-black"
          href={isNewOpen ? "/" : "/?new=1"}
        >
          {isNewOpen ? "Close" : "New task"}
        </Link>
      </div>

      {isNewOpen ? (
        <div className="mb-5">
          <TaskCreateWindow tags={tags} />
        </div>
      ) : null}

      <TaskWindow title="Pending Tasks">
        <div className="space-y-3">
          <TaskSearch basePath="/" />
          <TagFilter tags={tags} basePath="/" />
          {tasks.length === 0 ? (
            <div className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
              {searchQuery ? "No tasks match your search." : "No pending tasks."}
            </div>
          ) : (
            <TaskListDnd tasks={tasks} />
          )}
        </div>
      </TaskWindow>
    </div>
  );
}
