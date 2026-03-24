import { randomUUID } from "node:crypto";

import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  role?: User["role"];
};

type UserDocument = User;

let ensureUsersReadyPromise: Promise<void> | undefined;

async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function ensureUsersReady(): Promise<void> {
  if (!ensureUsersReadyPromise) {
    ensureUsersReadyPromise = (async () => {
      const collection = await getUsersCollection();
      await collection.createIndex({ id: 1 }, { unique: true });
      await collection.createIndex({ email: 1 }, { unique: true });
    })();
  }

  return ensureUsersReadyPromise;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (!isNonEmptyString(email)) return null;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  return collection.findOne({ email: normalizeEmail(email) });
}

export async function findUserById(id: string): Promise<User | null> {
  if (!isNonEmptyString(id)) return null;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  return collection.findOne({ id: id.trim() });
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const email = normalizeEmail(input.email);
  const passwordHash = input.passwordHash.trim();
  const role = input.role ?? "user";

  if (!isNonEmptyString(email)) {
    throw new Error("Email is required");
  }

  if (!isNonEmptyString(passwordHash)) {
    throw new Error("Password hash is required");
  }

  await ensureUsersReady();
  const collection = await getUsersCollection();

  const existingUser = await collection.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const now = new Date();
  const user: User = {
    id: randomUUID(),
    email,
    passwordHash,
    role,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(user);
  return user;
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  if (!isNonEmptyString(userId)) {
    throw new Error("User id is required");
  }

  if (!isNonEmptyString(passwordHash)) {
    throw new Error("Password hash is required");
  }

  await ensureUsersReady();
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId.trim() },
    {
      $set: {
        passwordHash: passwordHash.trim(),
        updatedAt: new Date(),
      },
    }
  );
}
