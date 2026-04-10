"use client";

import { useState, useActionState } from "react";

import type { Tag } from "@/lib/tags";
import { createTask } from "@/actions/tasks";
import { createTagAction, deleteTagAction, type TagActionState } from "@/actions/tags";

type TaskFormProps = {
  tags: Tag[];
};

const tagInitial: TagActionState = { ok: false };

export function TaskForm({ tags }: TaskFormProps) {
  const [selectedTagNames, setSelectedTagNames] = useState<Set<string>>(
    () => new Set()
  );
  const [showNewTag, setShowNewTag] = useState(false);
  const [tagState, tagFormAction, isTagPending] = useActionState(
    createTagAction,
    tagInitial
  );

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

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
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
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              name="dueDate"
              className="h-9 rounded-md bg-zinc-700 px-3 text-sm text-zinc-400 [color-scheme:dark]"
            />
            <button
              type="button"
              onClick={() => setShowNewTag((v) => !v)}
              className="h-9 rounded-md bg-zinc-700 px-2.5 text-sm text-zinc-400 hover:text-white"
            >
              + Tag
            </button>
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-zinc-700 px-3 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
          >
            Add task
          </button>
        </div>
      </form>

      {showNewTag ? (
        <form action={tagFormAction} className="flex items-center gap-2">
          <input
            name="name"
            type="text"
            placeholder="New tag name"
            className="flex-1 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-white"
            autoFocus
            disabled={isTagPending}
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
            disabled={isTagPending}
          >
            {isTagPending ? "…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setShowNewTag(false)}
            className="text-xs text-zinc-500 hover:text-white"
          >
            Cancel
          </button>
          {tagState.message && !tagState.ok ? (
            <span className="text-xs text-red-400">{tagState.message}</span>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
