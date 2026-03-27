import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { listUsers } from "@/lib/users";

import { UserRoleForm } from "./user-role-form";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const users = await listUsers();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">User management</h1>
        <p className="text-sm text-zinc-300">Promote or demote users between user and admin roles.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-dashed border-gray-200 bg-zinc-900">
        <table className="w-full border-collapse text-left text-sm text-zinc-200">
          <thead>
            <tr className="border-b border-dashed border-gray-200 text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Current role</th>
              <th className="px-4 py-3 font-medium">Change role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-dashed border-gray-200 last:border-b-0">
                <td className="px-4 py-3 text-zinc-100">{user.email}</td>
                <td className="px-4 py-3 text-zinc-300">{user.role}</td>
                <td className="px-4 py-3">
                  <UserRoleForm
                    userId={user.id}
                    currentRole={user.role}
                    isCurrentUser={user.id === session.user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}