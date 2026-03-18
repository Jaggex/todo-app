import { readFile } from "node:fs/promises";
import path from "node:path";

import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

type DevUser = {
  id: string;
  email: string;
  password: string;
};

const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");

async function readUsersFromDb(): Promise<DevUser[]> {
  try {
    const raw = await readFile(usersFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const schema = z.array(
      z.object({
        id: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(1),
      })
    );

    const result = schema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

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

async function readAllUsers(): Promise<DevUser[]> {
  const [dbUsers, envUser] = await Promise.all([
    readUsersFromDb(),
    Promise.resolve(readUserFromEnv()),
  ]);

  if (!envUser) return dbUsers;

  // If the same email exists in the JSON DB, the env user wins.
  const withoutSameEmail = dbUsers.filter(
    (u) => u.email.toLowerCase() !== envUser.email.toLowerCase()
  );
  return [envUser, ...withoutSameEmail];
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

        const users = await readAllUsers();
        const user = users.find(
          (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase()
        );
        if (!user) return null;

        // Dev-only: plain-text password from JSON.
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
