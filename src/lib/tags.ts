import { randomUUID } from "node:crypto";

import type { Collection } from "mongodb";

import { getDb } from "@/lib/mongodb";

export type Tag = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
};

type TagDocument = Tag;

let ensureTagsReadyPromise: Promise<void> | undefined;

async function getTagsCollection(): Promise<Collection<TagDocument>> {
  const db = await getDb();
  return db.collection<TagDocument>("tags");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function ensureTagsReady(): Promise<void> {
  if (!ensureTagsReadyPromise) {
    ensureTagsReadyPromise = (async () => {
      const collection = await getTagsCollection();
      await collection.createIndex({ id: 1 }, { unique: true });
      await collection.createIndex({ ownerId: 1, name: 1 }, { unique: true });
    })();
  }

  return ensureTagsReadyPromise;
}

function toTag(doc: TagDocument): Tag {
  return {
    id: doc.id,
    name: doc.name,
    ownerId: doc.ownerId,
    createdAt: doc.createdAt,
  };
}

export async function getTagsByOwner(ownerId: string): Promise<Tag[]> {
  if (!isNonEmptyString(ownerId)) return [];

  await ensureTagsReady();
  const collection = await getTagsCollection();
  const tags = await collection
    .find({ ownerId: ownerId.trim() })
    .sort({ name: 1 })
    .toArray();

  return tags.map(toTag);
}

export async function createTag(ownerId: string, name: string): Promise<Tag> {
  if (!isNonEmptyString(ownerId)) {
    throw new Error("Owner is required");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Tag name is required");
  }

  await ensureTagsReady();
  const collection = await getTagsCollection();

  const existing = await collection.findOne({
    ownerId: ownerId.trim(),
    name: trimmedName,
  });
  if (existing) {
    throw new Error("Tag already exists");
  }

  const tag: Tag = {
    id: randomUUID(),
    name: trimmedName,
    ownerId: ownerId.trim(),
    createdAt: new Date(),
  };

  await collection.insertOne(tag);
  return tag;
}

export async function deleteTag(ownerId: string, tagId: string): Promise<void> {
  if (!isNonEmptyString(ownerId) || !isNonEmptyString(tagId)) return;

  await ensureTagsReady();
  const collection = await getTagsCollection();
  await collection.deleteOne({ id: tagId.trim(), ownerId: ownerId.trim() });
}
