"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  addTask,
  deleteTaskById,
  reorderPendingTasksById,
  setTaskCompletedById,
} from "@/lib/tasks";

export type CreateTaskState = {
  ok: boolean;
  message?: string;
};

export async function createTaskAction(
  _prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
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
  const ids = reorderSchema.parse(orderedPendingTaskIds);

  await reorderPendingTasksById(ids);
  revalidatePath("/");
}

const taskIdSchema = z.string().min(1);

export async function setTaskCompleted(taskId: string, completed: boolean) {
  const id = taskIdSchema.parse(taskId);
  const isCompleted = z.boolean().parse(completed);

  await setTaskCompletedById(id, isCompleted);
  revalidatePath("/");
  revalidatePath("/completed");
}

export async function deleteTask(taskId: string) {
  const id = taskIdSchema.parse(taskId);

  await deleteTaskById(id);
  revalidatePath("/");
  revalidatePath("/completed");
}
