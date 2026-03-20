import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

type DevUser = {
  id: string;
  email: string;
  password: string;
};

function readUserFromEnv(): DevUser | null {
  const schema = z.object({
    DEV_AUTH_EMAIL: z.string().email(),
    DEV_AUTH_PASSWORD: z.string().min(1),
    DEV_AUTH_USER_ID: z.string().min(1).optional(),
  });

  const result = schema.safeParse({
    DEV_AUTH_EMAIL: process.env.DEV_AUTH_EMAIL,
    DEV_AUTH_PASSWORD: process.env.DEV_AUTH_PASSWORD,
    DEV_AUTH_USER_ID: process.env.DEV_AUTH_USER_ID,
  });

  if (!result.success) return null;

  return {
    id: result.data.DEV_AUTH_USER_ID ?? "env-user",
    email: result.data.DEV_AUTH_EMAIL,
    password: result.data.DEV_AUTH_PASSWORD,
  };
}

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

        const user = readUserFromEnv();
        if (!user) return null;

        if (user.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
          return null;
        }

        // Dev-only: plain-text password from .env.local.
        // Replace with hashed passwords when you move to Mongo.
        if (user.password !== parsed.data.password) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};
