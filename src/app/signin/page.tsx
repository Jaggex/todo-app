import type { Metadata } from "next";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Worktasks account to manage your tasks and team workspaces.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const callbackUrl = typeof resolved?.next === "string" ? resolved.next : "/";
  const accountCreated = resolved?.created === "1";

  return (
    <div className="mx-auto max-w-md">
      <SignInForm callbackUrl={callbackUrl} accountCreated={accountCreated} />
    </div>
  );
}
