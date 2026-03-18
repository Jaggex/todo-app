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

export type CreateTaskState = {
  ok: boolean;
  message?: string;
};

export async function createTaskAction(
  _prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  await requireSession();
  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle : "";
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage : "";

  if (!title.trim()) {
    return { ok: false, message: "Please enter a task title." };
  }

  try {
    await addTask(title, message);
  } catch {
    return { ok: false, message: "Could not save task." };
  }

  revalidatePath("/");
  revalidatePath("/completed");

  return { ok: true };
}

export async function createTask(formData: FormData): Promise<void> {
  await requireSession();
  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle : "";
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage : "";

  if (!title.trim()) {
    redirect("/?new=1");
  }

  await addTask(title, message);
  revalidatePath("/");
  revalidatePath("/completed");
  redirect("/");
}

const reorderSchema = z
  .array(z.string().min(1))
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate task ids");

export async function reorderPendingTasks(orderedPendingTaskIds: string[]) {
  await requireSession();
  const ids = reorderSchema.parse(orderedPendingTaskIds);

  await reorderPendingTasksById(ids);
  revalidatePath("/");
}

const taskIdSchema = z.string().min(1);

export async function setTaskCompleted(taskId: string, completed: boolean) {
  await requireSession();
  const id = taskIdSchema.parse(taskId);
  const isCompleted = z.boolean().parse(completed);

  await setTaskCompletedById(id, isCompleted);
  revalidatePath("/");
  revalidatePath("/completed");
}

export async function deleteTask(taskId: string) {
  await requireSession();
  const id = taskIdSchema.parse(taskId);

  await deleteTaskById(id);
  revalidatePath("/");
  revalidatePath("/completed");
}
