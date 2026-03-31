"use server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { deleteUser, findUserById, updateUserPasswordHash } from "@/lib/users";

export type ChangePasswordState = {
  ok: boolean;
  message?: string;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You must be signed in." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Could not change password.",
    };
  }

  const user = await findUserById(userId);
  if (!user) {
    return { ok: false, message: "User account was not found." };
  }

  const validCurrentPassword = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!validCurrentPassword) {
    return { ok: false, message: "Current password is incorrect." };
  }

  const nextPasswordHash = await hashPassword(parsed.data.newPassword);
  await updateUserPasswordHash(user.id, nextPasswordHash);

  return { ok: true, message: "Password updated." };
}

export type DeleteAccountState = {
  ok: boolean;
  message?: string;
  redirectTo?: string;
};

export async function deleteAccountAction(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You must be signed in." };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { ok: false, message: "Enter your password to confirm." };
  }

  const user = await findUserById(userId);
  if (!user) {
    return { ok: false, message: "User account was not found." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return { ok: false, message: "Password is incorrect." };
  }

  await deleteUser(user.id);
  return { ok: true, redirectTo: "/signin" };
}