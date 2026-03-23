import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const normalizedPassword = password.trim();
  if (!normalizedPassword) {
    throw new Error("Password is required");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(normalizedPassword, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [prefix, salt, hash] = storedHash.split("$");
  if (prefix !== HASH_PREFIX || !salt || !hash) {
    return false;
  }

  const normalizedPassword = password.trim();
  if (!normalizedPassword) {
    return false;
  }

  const expectedBuffer = Buffer.from(hash, "hex");
  const actualBuffer = (await scrypt(normalizedPassword, salt, expectedBuffer.length)) as Buffer;

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
