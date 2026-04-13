import { ObjectId, type Collection, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";

export type Tag = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
};

type TagDocument = Omit<Tag, "id">;

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
      await collection.createIndex({ ownerId: 1, name: 1 }, { unique: true });

      // Drop the legacy `id` unique index if it exists
      try {
        await collection.dropIndex("id_1");
      } catch {
        // index may not exist
      }
    })();
  }

  return ensureTagsReadyPromise;
}

function toTag(doc: WithId<TagDocument>): Tag {
  return {
    id: doc._id.toHexString(),
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

  const doc = {
    name: trimmedName,
    ownerId: ownerId.trim(),
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return {
    id: result.insertedId.toHexString(),
    ...doc,
  };
}

export async function deleteTag(ownerId: string, tagId: string): Promise<void> {
  if (!isNonEmptyString(ownerId) || !isNonEmptyString(tagId)) return;

  await ensureTagsReady();
  const collection = await getTagsCollection();
  await collection.deleteOne({ _id: new ObjectId(tagId.trim()), ownerId: ownerId.trim() });
}
