"use client";

import { useEffect, useRef, useState, useActionState, useTransition } from "react";

import type { Tag } from "@/lib/tags";
import type { Workspace } from "@/lib/workspaces";
import { createTask } from "@/actions/tasks";
import { createTagAction, deleteTagAction, type TagActionState } from "@/actions/tags";

type TaskFormProps = {
  tags: Tag[];
  workspaces?: Workspace[];
};

const tagInitial: TagActionState = { ok: false };

export function TaskForm({ tags, workspaces = [] }: TaskFormProps) {
  const [selectedTagNames, setSelectedTagNames] = useState<Set<string>>(
    () => new Set()
  );
  const [showNewTag, setShowNewTag] = useState(false);
  const [scope, setScope] = useState<"personal" | "shared">("personal");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagState, tagFormAction, isTagPending] = useActionState(
    createTagAction,
    tagInitial
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (tagState.ok && tagInputRef.current) {
      tagInputRef.current.value = "";
    }
  }, [tagState]);

  // Default workspace selection when switching to shared
  useEffect(() => {
    if (scope === "shared" && !selectedWorkspaceId && workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [scope, selectedWorkspaceId, workspaces]);

  function submitTag() {
    const fd = new FormData();
    fd.set("name", tagInputRef.current?.value ?? "");
    startTransition(() => {
      tagFormAction(fd);
    });
  }

  function toggleTag(name: string) {
    setSelectedTagNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleDeleteTag(tagId: string, tagName: string) {
    const ok = window.confirm(`Delete tag "${tagName}"? It won't be removed from existing tasks.`);
    if (!ok) return;
    await deleteTagAction(tagId);
  }

  return (
    <div className="space-y-2">
      <form action={createTask} className="space-y-2">
        <input
          className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm text-white"
          name="title"
          placeholder="Title"
        />

        <textarea
          className="w-full resize-none rounded-md bg-zinc-700 px-3 py-2 text-sm text-white"
          name="message"
          placeholder="Message (optional)"
          rows={3}
        />

        <input
          type="hidden"
          name="tags"
          value={Array.from(selectedTagNames).join(",")}
        />

        <input type="hidden" name="scope" value={scope} />
        {scope === "shared" && (
          <input type="hidden" name="workspaceId" value={selectedWorkspaceId} />
        )}

        {workspaces.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Scope:</span>
            <button
              type="button"
              onClick={() => setScope("personal")}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                scope === "personal"
                  ? "bg-zinc-200 text-zinc-900"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setScope("shared")}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                scope === "shared"
                  ? "bg-zinc-200 text-zinc-900"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              Shared
            </button>
            {scope === "shared" && workspaces.length > 1 && (
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="rounded-md bg-zinc-700 px-2 py-1 text-xs text-zinc-300"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            )}
            {scope === "shared" && workspaces.length === 1 && (
              <span className="text-xs text-zinc-400">→ {workspaces[0].name}</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowNewTag((v) => !v)}
            className="rounded-md bg-zinc-700 px-2.5 py-2 text-xs text-zinc-400 hover:text-white"
          >
            + Tag
          </button>
          {tags.map((tag) => {
            const selected = selectedTagNames.has(tag.name);
            return (
              <span key={tag.id} className="group flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                    selected
                      ? "bg-zinc-200 text-zinc-900"
                      : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  }`}
                >
                  {tag.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="hidden group-hover:inline-block text-xs text-zinc-500 hover:text-red-400"
                  title={`Delete "${tag.name}" tag`}
                >
                  ✕
                </button>
              </span>
            );
          })}
          {showNewTag ? (
            <div className="mt-1 flex items-center gap-1.5 basis-full">
              <input
                ref={tagInputRef}
                type="text"
                placeholder="New tag name"
                className="w-[10rem] rounded-md bg-zinc-700 px-3 py-2 text-xs text-white"
                autoFocus
                disabled={isTagPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitTag();
                  }
                }}
              />
              <button
                type="button"
                className="rounded-md bg-zinc-600 px-2.5 py-2 text-xs text-zinc-100 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
                disabled={isTagPending}
                onClick={() => {
                  submitTag();
                }}
              >
                {isTagPending ? "…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewTag(false)}
                className="text-xs text-zinc-300 hover:text-red-700"
              >
                Cancel
              </button>
              {tagState.message && !tagState.ok ? (
                <span className="text-xs text-red-400">{tagState.message}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 mt-1">
            <span className="pl-1 text-sm text-zinc-300">Due date</span>
            <input
              type="date"
              name="dueDate"
              className="h-8 rounded-md bg-zinc-700 px-3 text-sm text-zinc-400 [color-scheme:dark]"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-md bg-zinc-700 px-3 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
          >
            Add task
          </button>
        </div>
      </form>
    </div>
  );
}
