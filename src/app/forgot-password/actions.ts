"use server";

import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/users";

export type ForgotPasswordState = {
  ok: boolean;
  message?: string;
};

const schema = z.object({
  email: z.string().email("Enter a valid email."),
});

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Enter a valid email.",
    };
  }

  // Always return the same message to avoid email enumeration
  const genericMessage =
    "If an account with that email exists, a reset link has been sent.";

  const token = await createPasswordResetToken(parsed.data.email);
  if (!token) {
    return { ok: true, message: genericMessage };
  }

  try {
    await sendPasswordResetEmail(parsed.data.email, token);
  } catch (error) {
    console.error("[forgot-password] Failed to send email:", error);
    return { ok: false, message: "Failed to send email. Try again later." };
  }

  return { ok: true, message: genericMessage };
}
