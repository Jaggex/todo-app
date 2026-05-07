import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { MobileMenu } from "@/components/app-shell/MobileMenu";

export async function Topbar() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-dashed border-gray-200 bg-zinc-900 h-14">
      {/* Desktop layout */}
      <div className="hidden lg:grid h-full grid-cols-[16rem_1fr_16rem]">
        <div className="flex items-center justify-center border-r border-dashed border-gray-200 px-4">
          <div className="text-sm font-semibold tracking-tight text-white">Worktasks</div>
        </div>
        <div className="flex items-center px-6" />
        <div className="flex items-center justify-center border-l border-dashed border-gray-200 px-4">
          {session?.user?.email ? null : (
            <Link className="text-xs text-white hover:text-zinc-300" href="/signin">
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* Tablet layout */}
      <div className="hidden sm:grid lg:hidden h-full grid-cols-[5rem_1fr_5rem]">
        <div className="border-r border-dashed border-gray-200" />
        <div className="flex items-center justify-center">
          <div className="text-sm font-semibold tracking-tight text-white">Worktasks</div>
        </div>
        <div className="flex items-center justify-center border-l border-dashed border-gray-200">
          <MobileMenu email={session?.user?.email ?? undefined} role={session?.user?.role} />
        </div>
      </div>

      {/* Phone layout */}
      <div className="flex sm:hidden h-full items-center px-4">
        <div className="flex-1" />
        <div className="text-sm font-semibold tracking-tight text-white">Worktasks</div>
        <div className="flex-1 flex justify-end">
          <MobileMenu email={session?.user?.email ?? undefined} role={session?.user?.role} />
        </div>
      </div>
    </header>
  );
}
