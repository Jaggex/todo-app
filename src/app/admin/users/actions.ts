"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdmin } from "@/lib/admin";
import { deleteUser, updateUserRole, type UserRole } from "@/lib/users";

const roleSchema = z.enum(["user", "admin"]);
const userIdSchema = z.string().min(1);

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<void> {
  const session = await assertAdmin();

  const nextUserId = userIdSchema.parse(userId);
  const nextRole = roleSchema.parse(role);

  if (session.user.id === nextUserId && nextRole !== "admin") {
    throw new Error("You cannot remove your own admin role.");
  }

  await updateUserRole(nextUserId, nextRole);
  revalidatePath("/admin/users");
}

export async function deleteUserAction(userId: string): Promise<void> {
  const session = await assertAdmin();

  const targetUserId = userIdSchema.parse(userId);

  if (session.user.id === targetUserId) {
    throw new Error("You cannot delete your own account.");
  }

  await deleteUser(targetUserId);
  revalidatePath("/admin/users");
}