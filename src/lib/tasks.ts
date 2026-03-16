import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import "@/data/tasks.json";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

const tasksFilePath = path.join(process.cwd(), "src", "data", "tasks.json");

function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.completed === "boolean"
  );
}

async function readTasksFromDb(): Promise<Task[]> {
  try {
    const raw = await readFile(tasksFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTask);
  } catch {
    return [];
  }
}

async function writeTasksToDb(tasks: Task[]): Promise<void> {
  const tempFilePath = `${tasksFilePath}.tmp`;
  const json = JSON.stringify(tasks, null, 2) + "\n";

  await writeFile(tempFilePath, json, "utf8");
  await rename(tempFilePath, tasksFilePath);
}

export async function getPendingTasks() {
  const tasks = await readTasksFromDb();
  return tasks.filter((task) => !task.completed);
}

export async function getCompletedTasks() {
  const tasks = await readTasksFromDb();
  return tasks.filter((task) => task.completed);
}

export async function addTask(title: string) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }

  const tasks = await readTasksFromDb();
  const newTask: Task = {
    id: randomUUID(),
    title: trimmedTitle,
    completed: false,
  };

  await writeTasksToDb([...tasks, newTask]);
  return newTask;
}
