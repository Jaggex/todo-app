import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/app-shell/UserMenu";

const navItems = [
  { href: "/", label: "Pending" },
  { href: "/completed", label: "Completed" },
  { href: "/workspaces", label: "Workspaces" },
];

export async function Sidebar() {
  const session = await getServerSession(authOptions);

  return (
    <aside className="flex flex-col flex-1 bg-zinc-900 p-4 h-full">
      {session?.user ? (
        <>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4">
            <UserMenu email={session.user.email!} role={session.user.role} />
          </div>
        </>
      ) : null}
    </aside>
  );
}
