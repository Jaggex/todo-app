import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/app-shell/UserMenu";

export async function Topbar() {
  const session = await getServerSession(authOptions);

  return (
    <header className="grid h-14 grid-cols-[16rem_1fr_16rem] border-b border-dashed border-gray-200 bg-zinc-900">
      <div className="flex items-center justify-center border-r border-dashed border-gray-200 px-4">
        <div className="text-sm font-semibold tracking-tight text-white">Worktasks</div>
      </div>

      <div className="flex items-center px-6" />

      <div className="flex items-center justify-end border-l border-dashed border-gray-200 px-4">
        {session?.user?.email ? (
          <UserMenu email={session.user.email} role={session.user.role} />
        ) : (
          <Link className="text-xs text-white" href="/signin">
            Signed out
          </Link>
        )}
      </div>
    </header>
  );
}
