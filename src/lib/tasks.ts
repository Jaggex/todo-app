import { ObjectId, type Collection, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";

export type TaskScope = "personal" | "shared";

export type Task = {
  id: string;
  title: string;
  message?: string;
  dueDate?: Date;
  tags: string[];
  completed: boolean;
  ownerId: string;
  scope: TaskScope;
  workspaceId?: string;
  createdBy?: string;
};

type TaskDocument = Omit<Task, "id"> & {
  order: number;
};

let ensureMongoTasksReadyPromise: Promise<void> | undefined;

async function getTasksCollection(): Promise<Collection<TaskDocument>> {
  const db = await getDb();
  return db.collection<TaskDocument>("tasks");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOwnerId(ownerId: string): string {
  return ownerId.trim();
}

function toTask(task: WithId<TaskDocument>): Task {
  return {
    id: task._id.toHexString(),
    title: task.title,
    message: task.message,
    dueDate: task.dueDate,
    tags: task.tags ?? [],
    completed: task.completed,
    ownerId: task.ownerId,
    scope: task.scope ?? "personal",
    workspaceId: task.workspaceId,
    createdBy: task.createdBy,
  };
}

async function ensureMongoTasksReady(): Promise<void> {
  if (!ensureMongoTasksReadyPromise) {
    ensureMongoTasksReadyPromise = (async () => {
      const collection = await getTasksCollection();

      await collection.createIndex({ ownerId: 1, completed: 1, order: 1 });

      // Drop the legacy `id` unique index if it exists
      try {
        await collection.dropIndex("id_1");
      } catch {
        // index may not exist
      }
      await collection.createIndex({ title: "text", message: "text" });
    })();
  }

  return ensureMongoTasksReadyPromise;
}

async function getNextOrder(ownerId: string, completed: boolean): Promise<number> {
  const collection = await getTasksCollection();
  const lastTask = await collection.findOne(
    { ownerId, completed },
    { sort: { order: -1 }, projection: { order: 1 } }
  );

  return typeof lastTask?.order === "number" ? lastTask.order + 1 : 0;
}

export async function getPendingTasks(ownerId: string, search?: string, tags?: string[]) {
  if (!isNonEmptyString(ownerId)) return [];
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();

  const filter: Record<string, unknown> = {
    ownerId: normalizedOwnerId,
    completed: false,
  };

  if (tags && tags.length > 0) {
    filter.tags = { $all: tags };
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };
    filter.$or = [{ title: regex }, { message: regex }, { tags: regex }];
  }

  const tasks = await collection
    .find(filter)
    .sort({ order: 1, _id: 1 })
    .toArray();

  return tasks.map(toTask);
}

export const COMPLETED_TASKS_PAGE_SIZE = 25;

export async function getSharedPendingTasks(workspaceIds: string[]): Promise<Task[]> {
  if (!workspaceIds.length) return [];

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();

  const tasks = await collection
    .find({ scope: "shared", workspaceId: { $in: workspaceIds }, completed: false })
    .sort({ _id: -1 })
    .toArray();

  return tasks.map(toTask);
}

export async function getCompletedTasks(
  ownerId: string,
  search?: string,
  tags?: string[],
  page = 1
) {
  if (!isNonEmptyString(ownerId)) return { tasks: [], totalPages: 0 };
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();

  const filter: Record<string, unknown> = {
    ownerId: normalizedOwnerId,
    completed: true,
  };

  if (tags && tags.length > 0) {
    filter.tags = { $all: tags };
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };
    filter.$or = [{ title: regex }, { message: regex }, { tags: regex }];
  }

  const safePage = Math.max(1, Math.floor(page));
  const skip = (safePage - 1) * COMPLETED_TASKS_PAGE_SIZE;

  const [taskDocs, totalCount] = await Promise.all([
    collection
      .find(filter)
      .sort({ order: 1, _id: 1 })
      .skip(skip)
      .limit(COMPLETED_TASKS_PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / COMPLETED_TASKS_PAGE_SIZE);

  return { tasks: taskDocs.map(toTask), totalPages };
}

export type AddTaskOptions = {
  scope?: TaskScope;
  workspaceId?: string;
  createdBy?: string;
};

export async function addTask(
  ownerId: string,
  title: string,
  message?: string,
  dueDate?: Date,
  tags?: string[],
  options: AddTaskOptions = {}
) {
  if (!isNonEmptyString(ownerId)) {
    throw new Error("Owner is required");
  }
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }

  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  const scope = options.scope ?? "personal";

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  const doc: Omit<TaskDocument, "_id"> = {
    title: trimmedTitle,
    message: trimmedMessage ? trimmedMessage : undefined,
    dueDate: dueDate ?? undefined,
    tags: tags ?? [],
    completed: false,
    ownerId: normalizedOwnerId,
    scope,
    workspaceId: options.workspaceId,
    createdBy: options.createdBy,
    order: await getNextOrder(normalizedOwnerId, false),
  };

  const result = await collection.insertOne(doc as TaskDocument);
  return {
    id: result.insertedId.toHexString(),
    ...doc,
  };
}

export async function reorderPendingTasksById(
  ownerId: string,
  orderedPendingTaskIds: string[]
) {
  if (!isNonEmptyString(ownerId)) return;
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();

  const ownedPending = await collection
    .find({ ownerId: normalizedOwnerId, completed: false })
    .sort({ order: 1, _id: 1 })
    .toArray();

  const pendingById = new Map(ownedPending.map((task) => [task._id.toHexString(), task] as const));

  const nextOrderIds: string[] = [];
  for (const id of orderedPendingTaskIds) {
    if (!pendingById.has(id)) continue;
    nextOrderIds.push(id);
    pendingById.delete(id);
  }

  nextOrderIds.push(...pendingById.keys());

  if (nextOrderIds.length === 0) return;

  await collection.bulkWrite(
    nextOrderIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new ObjectId(id), ownerId: normalizedOwnerId, completed: false },
        update: { $set: { order: index } },
      },
    }))
  );
}

export async function setTaskCompletedById(
  ownerId: string,
  taskId: string,
  completed: boolean
) {
  if (!isNonEmptyString(ownerId)) return;
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  await collection.updateOne(
    { _id: new ObjectId(taskId), ownerId: normalizedOwnerId },
    {
      $set: {
        completed,
        order: await getNextOrder(normalizedOwnerId, completed),
      },
    }
  );
}

export async function updateTaskById(
  ownerId: string,
  taskId: string,
  update: { title: string; message?: string; dueDate?: Date; tags: string[] }
) {
  if (!isNonEmptyString(ownerId)) return;
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  const trimmedTitle = update.title.trim();
  if (!trimmedTitle) throw new Error("Title is required");

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  await collection.updateOne(
    { _id: new ObjectId(taskId), ownerId: normalizedOwnerId },
    {
      $set: {
        title: trimmedTitle,
        message: update.message?.trim() || undefined,
        dueDate: update.dueDate ?? undefined,
        tags: update.tags,
      },
    }
  );
}

export async function deleteTaskById(ownerId: string, taskId: string) {
  if (!isNonEmptyString(ownerId)) return;
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  await collection.deleteOne({ _id: new ObjectId(taskId), ownerId: normalizedOwnerId });
}

export async function deleteTasksByIds(ownerId: string, taskIds: string[]) {
  if (!isNonEmptyString(ownerId) || taskIds.length === 0) return;
  const normalizedOwnerId = normalizeOwnerId(ownerId);
  const objectIds = taskIds.map((id) => new ObjectId(id));

  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  await collection.deleteMany({ _id: { $in: objectIds }, ownerId: normalizedOwnerId });
}

// Workspace-scoped operations: any member can complete/delete shared tasks.
// The caller must verify workspace membership before calling these.

export async function setSharedTaskCompletedById(
  taskId: string,
  workspaceId: string,
  completed: boolean
) {
  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  await collection.updateOne(
    { _id: new ObjectId(taskId), scope: "shared", workspaceId },
    { $set: { completed, order: 0 } }
  );
}

export async function deleteSharedTaskById(taskId: string, workspaceId: string) {
  await ensureMongoTasksReady();
  const collection = await getTasksCollection();
  await collection.deleteOne({ _id: new ObjectId(taskId), scope: "shared", workspaceId });
}
