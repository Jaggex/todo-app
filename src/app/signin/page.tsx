import { SignInForm } from "./signin-form";

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
