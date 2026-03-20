import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import "@/data/tasks.json";

export type Task = {
  id: string;
  title: string;
  message?: string;
  completed: boolean;
  ownerKey: string;
};

type DbTask = Omit<Task, "ownerKey"> & { ownerKey?: string };

const tasksFilePath = path.join(process.cwd(), "src", "data", "tasks.json");

function isDbTask(value: unknown): value is DbTask {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    (typeof record.message === "undefined" || typeof record.message === "string") &&
    typeof record.completed === "boolean" &&
    (typeof record.ownerKey === "undefined" || typeof record.ownerKey === "string")
  );
}

async function readTasksFromDb(): Promise<DbTask[]> {
  try {
    const raw = await readFile(tasksFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDbTask);
  } catch {
    return [];
  }
}

async function writeTasksToDb(tasks: DbTask[]): Promise<void> {
  const tempFilePath = `${tasksFilePath}.tmp`;
  const json = JSON.stringify(tasks, null, 2) + "\n";

  await writeFile(tempFilePath, json, "utf8");
  await rename(tempFilePath, tasksFilePath);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOwnerKey(ownerKey: string): string {
  return ownerKey.trim().toLowerCase();
}

async function migrateLegacyTasksIfNeeded(
  tasks: DbTask[],
  ownerKey: string
): Promise<DbTask[]> {
  if (tasks.length === 0) return tasks;

  const hasAnyOwnerKey = tasks.some((task) => isNonEmptyString(task.ownerKey));
  if (hasAnyOwnerKey) return tasks;

  // One-time migration: if the DB has legacy tasks without ownerKey,
  // assign them all to the currently signed-in user.
  const migrated: Task[] = tasks.map((task) => ({
    ...task,
    ownerKey,
  }));

  await writeTasksToDb(migrated);
  return migrated;
}

function tasksForOwner(tasks: DbTask[], ownerKey: string): Task[] {
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);
  return tasks
    .filter(
      (task): task is Task =>
        isNonEmptyString(task.ownerKey) &&
        normalizeOwnerKey(task.ownerKey) === normalizedOwnerKey
    )
    .map((task) => ({ ...task, ownerKey: task.ownerKey }));
}

export async function getPendingTasks(ownerKey: string) {
  if (!isNonEmptyString(ownerKey)) return [];
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  const tasks = await migrateLegacyTasksIfNeeded(
    await readTasksFromDb(),
    normalizedOwnerKey
  );
  return tasksForOwner(tasks, normalizedOwnerKey).filter((task) => !task.completed);
}

export async function getCompletedTasks(ownerKey: string) {
  if (!isNonEmptyString(ownerKey)) return [];
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  const tasks = await migrateLegacyTasksIfNeeded(
    await readTasksFromDb(),
    normalizedOwnerKey
  );
  return tasksForOwner(tasks, normalizedOwnerKey).filter((task) => task.completed);
}

export async function addTask(ownerKey: string, title: string, message?: string) {
  if (!isNonEmptyString(ownerKey)) {
    throw new Error("Owner is required");
  }
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }

  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  const tasks = await migrateLegacyTasksIfNeeded(
    await readTasksFromDb(),
    normalizedOwnerKey
  );
  const newTask: Task = {
    id: randomUUID(),
    title: trimmedTitle,
    message: trimmedMessage ? trimmedMessage : undefined,
    completed: false,
    ownerKey: normalizedOwnerKey,
  };

  await writeTasksToDb([...tasks, newTask]);
  return newTask;
}

export async function reorderPendingTasksById(
  ownerKey: string,
  orderedPendingTaskIds: string[]
) {
  if (!isNonEmptyString(ownerKey)) return;
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  const tasks = await migrateLegacyTasksIfNeeded(
    await readTasksFromDb(),
    normalizedOwnerKey
  );

  const ownedPending = tasks.filter(
    (task) =>
      !task.completed &&
      isNonEmptyString(task.ownerKey) &&
      normalizeOwnerKey(task.ownerKey) === normalizedOwnerKey
  );

  const pendingById = new Map(
    ownedPending.map((task) => [task.id, task] as const)
  );

  const nextOwnedPending: DbTask[] = [];
  for (const id of orderedPendingTaskIds) {
    const task = pendingById.get(id);
    if (!task) continue;
    nextOwnedPending.push(task);
    pendingById.delete(id);
  }

  // Safety: keep any owned pending tasks not included in the request.
  nextOwnedPending.push(...pendingById.values());

  // Replace only the owned pending tasks in-place to avoid affecting other users.
  let replacementIndex = 0;
  const nextAll = tasks.map((task) => {
    if (task.completed) return task;
    if (!isNonEmptyString(task.ownerKey)) return task;
    if (normalizeOwnerKey(task.ownerKey) !== normalizedOwnerKey) return task;

    const replacement = nextOwnedPending[replacementIndex];
    replacementIndex += 1;
    return replacement ?? task;
  });

  await writeTasksToDb(nextAll);
}

export async function setTaskCompletedById(
  ownerKey: string,
  taskId: string,
  completed: boolean
) {
  if (!isNonEmptyString(ownerKey)) return;
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  const tasks = await migrateLegacyTasksIfNeeded(
    await readTasksFromDb(),
    normalizedOwnerKey
  );
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    if (!isNonEmptyString(task.ownerKey)) return task;
    if (normalizeOwnerKey(task.ownerKey) !== normalizedOwnerKey) return task;
    return { ...task, completed };
  });

  await writeTasksToDb(next);
}

export async function deleteTaskById(ownerKey: string, taskId: string) {
  if (!isNonEmptyString(ownerKey)) return;
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  const tasks = await migrateLegacyTasksIfNeeded(
    await readTasksFromDb(),
    normalizedOwnerKey
  );
  const next = tasks.filter((task) => {
    if (task.id !== taskId) return true;
    if (!isNonEmptyString(task.ownerKey)) return true;
    return normalizeOwnerKey(task.ownerKey) !== normalizedOwnerKey;
  });
  await writeTasksToDb(next);
}
