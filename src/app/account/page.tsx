import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountSection } from "./delete-account-section";
import { authOptions } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Account</h1>
        <p className="text-sm text-zinc-300">Signed in as {session.user.email}</p>
        <p className="text-xs text-zinc-400">Role: {session.user.role}</p>
      </div>

      <ChangePasswordForm />

      <hr className="border-dashed border-gray-200" />

      <DeleteAccountSection />
    </div>
  );
}