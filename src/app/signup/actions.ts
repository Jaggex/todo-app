"use server";

import { z } from "zod";

import { sendVerificationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { createUser, findUserByEmail } from "@/lib/users";

export type SignUpState = {
  ok: boolean;
  message?: string;
  redirectTo?: string;
};

const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  const rawCallbackUrl = formData.get("callbackUrl");
  const callbackUrl = typeof rawCallbackUrl === "string" && rawCallbackUrl ? rawCallbackUrl : null;

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Could not create account.",
    };
  }

  const existingUser = await findUserByEmail(parsed.data.email);
  if (existingUser) {
    return { ok: false, message: "An account with that email already exists." };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUser({
      email: parsed.data.email,
      passwordHash,
    });

    try {
      await sendVerificationEmail(user.email, user.verificationToken!, callbackUrl ?? undefined);
    } catch (emailError) {
      console.error("[signup] Failed to send verification email:", emailError);
    }

    return {
      ok: true,
      message: "Account created. Check your email to verify your address.",
      redirectTo: callbackUrl
        ? `/signin?created=1&next=${encodeURIComponent(callbackUrl)}`
        : "/signin?created=1",
    };
  } catch {
    return { ok: false, message: "Could not create account." };
  }
}
