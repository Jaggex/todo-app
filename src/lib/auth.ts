import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { verifyPassword } from "@/lib/password";
import { findUserByEmail } from "@/lib/users";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret && process.env.NODE_ENV !== "test") {
  // In dev, if you don't set NEXTAUTH_SECRET, NextAuth may generate a different
  // secret across restarts, and existing session cookies will fail to decrypt.
  console.warn(
    "[auth] NEXTAUTH_SECRET is not set. Set it in .env.local to avoid JWT_SESSION_ERROR."
  );
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.userId = user.id;
      }

      const userRole =
        user && "role" in user && typeof user.role === "string"
          ? user.role
          : undefined;

      if (userRole === "user" || userRole === "admin") {
        token.userRole = userRole;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      if (session.user && typeof token.userRole === "string") {
        session.user.role = token.userRole as "user" | "admin";
      }

      return session;
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await findUserByEmail(parsed.data.email);
        if (!user) {
          return null;
        }

        if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};
