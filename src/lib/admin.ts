import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

/**
 * Require an authenticated admin session.
 * Redirects to /signin (no session) or / (non-admin) when called from pages.
 * Returns the validated session for further use.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

/**
 * Assert admin role in server actions (throws instead of redirecting).
 */
export async function assertAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session;
}
