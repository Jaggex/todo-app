"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { updateUserRole, type UserRole } from "@/lib/users";

const roleSchema = z.enum(["user", "admin"]);
const userIdSchema = z.string().min(1);

function assertAdminRole(role: unknown): asserts role is UserRole {
  if (role !== "admin") {
    throw new Error("Forbidden");
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<void> {
  const session = await getServerSession(authOptions);
  assertAdminRole(session?.user?.role);

  const nextUserId = userIdSchema.parse(userId);
  const nextRole = roleSchema.parse(role);

  if (session?.user?.id === nextUserId && nextRole !== "admin") {
    throw new Error("You cannot remove your own admin role.");
  }

  await updateUserRole(nextUserId, nextRole);
  revalidatePath("/admin/users");
}