import type { Metadata } from "next";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a free Worktasks account to manage your tasks and collaborate with your team.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const callbackUrl = typeof resolved?.next === "string" ? resolved.next : undefined;

  return (
    <div className="mx-auto max-w-md">
      <SignUpForm callbackUrl={callbackUrl} />
    </div>
  );
}
