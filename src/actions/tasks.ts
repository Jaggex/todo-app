"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  addTask,
  deleteTaskById,
  deleteTasksByIds,
  reorderPendingTasksById,
  setTaskCompletedById,
  setSharedTaskCompletedById,
  deleteSharedTaskById,
  updateTaskById,
  type TaskScope,
} from "@/lib/tasks";
import { getWorkspaceMembership } from "@/lib/workspaces";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }
  return session;
}

function requireOwnerId(session: Awaited<ReturnType<typeof requireSession>>) {
  const userId = session.user?.id;
  if (!userId) {
    redirect("/signin");
  }
  return userId;
}

export type CreateTaskState = {
  ok: boolean;
  message?: string;
};

export async function createTaskAction(
  _prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle : "";
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const rawDueDate = formData.get("dueDate");
  const dueDate = typeof rawDueDate === "string" && rawDueDate ? new Date(rawDueDate) : undefined;
  const rawTags = formData.get("tags");
  const tags = typeof rawTags === "string" && rawTags ? rawTags.split(",").filter(Boolean) : [];
  const rawScope = formData.get("scope");
  const scope: TaskScope = rawScope === "shared" ? "shared" : "personal";
  const rawWorkspaceId = formData.get("workspaceId");
  const workspaceId = scope === "shared" && typeof rawWorkspaceId === "string" && rawWorkspaceId ? rawWorkspaceId : undefined;

  if (!title.trim()) {
    return { ok: false, message: "Please enter a task title." };
  }

  if (scope === "shared") {
    if (!workspaceId) return { ok: false, message: "Please select a workspace." };
    const membership = await getWorkspaceMembership(workspaceId, ownerId);
    if (!membership) return { ok: false, message: "You are not a member of that workspace." };
  }

  try {
    await addTask(ownerId, title, message, dueDate, tags, { scope, workspaceId, createdBy: ownerId });
  } catch {
    return { ok: false, message: "Could not save task." };
  }

  revalidatePath("/");
  revalidatePath("/completed");

  return { ok: true };
}

export async function createTask(formData: FormData): Promise<void> {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle : "";
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const rawDueDate = formData.get("dueDate");
  const dueDate = typeof rawDueDate === "string" && rawDueDate ? new Date(rawDueDate) : undefined;
  const rawTags = formData.get("tags");
  const tags = typeof rawTags === "string" && rawTags ? rawTags.split(",").filter(Boolean) : [];
  const rawScope = formData.get("scope");
  const scope: TaskScope = rawScope === "shared" ? "shared" : "personal";
  const rawWorkspaceId = formData.get("workspaceId");
  const workspaceId = scope === "shared" && typeof rawWorkspaceId === "string" && rawWorkspaceId ? rawWorkspaceId : undefined;

  if (!title.trim()) {
    redirect("/?new=1");
  }

  if (scope === "shared" && workspaceId) {
    const membership = await getWorkspaceMembership(workspaceId, ownerId);
    if (!membership) redirect("/?new=1");
  }

  await addTask(ownerId, title, message, dueDate, tags, { scope, workspaceId, createdBy: ownerId });
  revalidatePath("/");
  revalidatePath("/completed");
  redirect("/");
}

const reorderSchema = z
  .array(z.string().min(1))
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate task ids");

export async function reorderPendingTasks(orderedPendingTaskIds: string[]) {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const ids = reorderSchema.parse(orderedPendingTaskIds);

  await reorderPendingTasksById(ownerId, ids);
  revalidatePath("/");
}

const taskIdSchema = z.string().min(1);

export async function setTaskCompleted(taskId: string, completed: boolean) {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const id = taskIdSchema.parse(taskId);
  const isCompleted = z.boolean().parse(completed);

  await setTaskCompletedById(ownerId, id, isCompleted);
  revalidatePath("/");
  revalidatePath("/completed");
}

export async function deleteTask(taskId: string) {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const id = taskIdSchema.parse(taskId);

  await deleteTaskById(ownerId, id);
  revalidatePath("/");
  revalidatePath("/completed");
}

export async function updateTask(
  taskId: string,
  title: string,
  message: string,
  dueDate: string,
  tags: string[]
): Promise<void> {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const id = taskIdSchema.parse(taskId);

  await updateTaskById(ownerId, id, {
    title,
    message: message || undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    tags,
  });

  revalidatePath("/");
  revalidatePath("/completed");
}

const taskIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate task ids");

export async function deleteSelectedTasks(taskIds: string[]) {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const ids = taskIdsSchema.parse(taskIds);

  await deleteTasksByIds(ownerId, ids);
  revalidatePath("/completed");
}

export async function setSharedTaskCompleted(
  taskId: string,
  workspaceId: string,
  completed: boolean
) {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const id = taskIdSchema.parse(taskId);
  const wsId = taskIdSchema.parse(workspaceId);
  const isCompleted = z.boolean().parse(completed);

  const membership = await getWorkspaceMembership(wsId, ownerId);
  if (!membership) throw new Error("Not a workspace member");

  await setSharedTaskCompletedById(id, wsId, isCompleted);
  revalidatePath("/");
}

export async function deleteSharedTask(taskId: string, workspaceId: string) {
  const session = await requireSession();
  const ownerId = requireOwnerId(session);
  const id = taskIdSchema.parse(taskId);
  const wsId = taskIdSchema.parse(workspaceId);

  const membership = await getWorkspaceMembership(wsId, ownerId);
  if (!membership) throw new Error("Not a workspace member");

  await deleteSharedTaskById(id, wsId);
  revalidatePath("/");
}
