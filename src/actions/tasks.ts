"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  addTask,
  deleteTaskById,
  reorderPendingTasksById,
  setTaskCompletedById,
} from "@/lib/tasks";

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

  if (!title.trim()) {
    return { ok: false, message: "Please enter a task title." };
  }

  try {
    await addTask(ownerId, title, message, dueDate, tags);
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

  if (!title.trim()) {
    redirect("/?new=1");
  }

  await addTask(ownerId, title, message, dueDate, tags);
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
