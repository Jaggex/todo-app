"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { addTask, reorderPendingTasksById } from "@/lib/tasks";

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

  if (!title.trim()) {
    return { ok: false, message: "Please enter a task title." };
  }

  try {
    await addTask(title);
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

  if (!title.trim()) {
    redirect("/?new=1");
  }

  await addTask(title);
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
