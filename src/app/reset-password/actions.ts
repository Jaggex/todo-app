"use server";

import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { resetPasswordWithToken } from "@/lib/users";

export type ResetPasswordState = {
  ok: boolean;
  message?: string;
};

const schema = z
  .object({
    token: z.string().min(1, "Reset token is missing."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const newHash = await hashPassword(parsed.data.password);
  const success = await resetPasswordWithToken(parsed.data.token, newHash);

  if (!success) {
    return {
      ok: false,
      message: "Invalid or expired reset link. Request a new one.",
    };
  }

  return {
    ok: true,
    message: "Password reset. You can now sign in with your new password.",
  };
}
