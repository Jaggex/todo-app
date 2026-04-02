import { randomBytes, randomUUID } from "node:crypto";

import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb";

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  verificationToken: string | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  role?: UserRole;
};

type UserDocument = Omit<User, "role" | "emailVerified" | "verificationToken" | "resetToken" | "resetTokenExpiry"> & {
  role?: UserRole;
  emailVerified?: boolean;
  verificationToken?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
};

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

function normalizeRole(role: UserDocument["role"]): UserRole {
  return role === "admin" ? "admin" : "user";
}

function toUser(user: UserDocument): User {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    role: normalizeRole(user.role),
    emailVerified: user.emailVerified ?? false,
    verificationToken: user.verificationToken ?? null,
    resetToken: user.resetToken ?? null,
    resetTokenExpiry: user.resetTokenExpiry ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function ensureUsersReady(): Promise<void> {
  if (!ensureUsersReadyPromise) {
    ensureUsersReadyPromise = (async () => {
      const collection = await getUsersCollection();
      await collection.createIndex({ id: 1 }, { unique: true });
      await collection.createIndex({ email: 1 }, { unique: true });
      await collection.updateMany(
        {
          $or: [
            { role: { $exists: false } },
            { role: { $nin: ["user", "admin"] } },
          ],
        },
        { $set: { role: "user" } }
      );
      // Backfill existing users as verified (they predate email verification)
      await collection.updateMany(
        { emailVerified: { $exists: false } },
        { $set: { emailVerified: true, verificationToken: null } }
      );
    })();
  }

  return ensureUsersReadyPromise;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (!isNonEmptyString(email)) return null;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  const user = await collection.findOne({ email: normalizeEmail(email) });
  return user ? toUser(user) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (!isNonEmptyString(id)) return null;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  const user = await collection.findOne({ id: id.trim() });
  return user ? toUser(user) : null;
}

export async function listUsers(): Promise<User[]> {
  await ensureUsersReady();
  const collection = await getUsersCollection();
  const users = await collection.find({}).sort({ createdAt: 1, email: 1 }).toArray();
  return users.map(toUser);
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
  const verificationToken = randomBytes(32).toString("hex");
  const user: User = {
    id: randomUUID(),
    email,
    passwordHash,
    role,
    emailVerified: false,
    verificationToken,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(user);
  return user;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  if (!isNonEmptyString(userId)) {
    throw new Error("User id is required");
  }

  await ensureUsersReady();
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId.trim() },
    {
      $set: {
        role,
        updatedAt: new Date(),
      },
    }
  );
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

export async function deleteUser(userId: string): Promise<void> {
  if (!isNonEmptyString(userId)) {
    throw new Error("User id is required");
  }

  await ensureUsersReady();
  const collection = await getUsersCollection();
  await collection.deleteOne({ id: userId.trim() });
}

export async function verifyEmail(token: string): Promise<boolean> {
  if (!isNonEmptyString(token)) return false;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  const result = await collection.updateOne(
    { verificationToken: token.trim() },
    {
      $set: {
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount === 1;
}

export async function regenerateVerificationToken(
  email: string
): Promise<string | null> {
  if (!isNonEmptyString(email)) return null;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  const token = randomBytes(32).toString("hex");
  const result = await collection.updateOne(
    { email: normalizeEmail(email), emailVerified: { $ne: true } },
    {
      $set: {
        verificationToken: token,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount === 1 ? token : null;
}

export async function createPasswordResetToken(
  email: string
): Promise<string | null> {
  if (!isNonEmptyString(email)) return null;

  await ensureUsersReady();
  const collection = await getUsersCollection();
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const result = await collection.updateOne(
    { email: normalizeEmail(email) },
    {
      $set: {
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount === 1 ? token : null;
}

export async function resetPasswordWithToken(
  token: string,
  newPasswordHash: string
): Promise<boolean> {
  if (!isNonEmptyString(token) || !isNonEmptyString(newPasswordHash)) {
    return false;
  }

  await ensureUsersReady();
  const collection = await getUsersCollection();
  const result = await collection.updateOne(
    {
      resetToken: token.trim(),
      resetTokenExpiry: { $gt: new Date() },
    },
    {
      $set: {
        passwordHash: newPasswordHash.trim(),
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount === 1;
}
