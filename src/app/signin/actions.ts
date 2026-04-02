"use server";

import { sendVerificationEmail } from "@/lib/email";
import { regenerateVerificationToken } from "@/lib/users";

export type ResendState = {
  ok: boolean;
  message?: string;
};

export async function resendVerificationAction(
  _prevState: ResendState,
  formData: FormData
): Promise<ResendState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, message: "Email is required." };
  }

  const token = await regenerateVerificationToken(email);
  if (!token) {
    // Either already verified or no such user — don't reveal which
    return {
      ok: true,
      message: "If that email needs verification, a new link has been sent.",
    };
  }

  try {
    await sendVerificationEmail(email.trim(), token);
  } catch (error) {
    console.error("[resend-verification] Failed to send email:", error);
    return { ok: false, message: "Failed to send email. Try again later." };
  }

  return {
    ok: true,
    message: "Verification email sent. Check your inbox.",
  };
}
