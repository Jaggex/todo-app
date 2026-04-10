"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { createTag as createTagInDb, deleteTag as deleteTagInDb } from "@/lib/tags";

async function requireOwnerId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");
  const userId = session.user?.id;
  if (!userId) redirect("/signin");
  return userId;
}

export type TagActionState = {
  ok: boolean;
  message?: string;
};

export async function createTagAction(
  _prevState: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  const ownerId = await requireOwnerId();
  const name = formData.get("name");

  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, message: "Tag name is required." };
  }

  try {
    await createTagInDb(ownerId, name);
  } catch {
    return { ok: false, message: "Could not create tag. It may already exist." };
  }

  revalidatePath("/");
  revalidatePath("/completed");
  return { ok: true };
}

export async function deleteTagAction(tagId: string): Promise<void> {
  const ownerId = await requireOwnerId();
  await deleteTagInDb(ownerId, tagId);
  revalidatePath("/");
  revalidatePath("/completed");
}
