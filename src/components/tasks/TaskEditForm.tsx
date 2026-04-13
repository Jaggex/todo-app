"use client";

import { useEffect, useRef, useState, useActionState, useTransition } from "react";

import type { Tag } from "@/lib/tags";
import { updateTask } from "@/actions/tasks";
import { createTagAction, deleteTagAction, type TagActionState } from "@/actions/tags";

type TaskEditFormProps = {
  taskId: string;
  initialTitle: string;
  initialMessage?: string;
  initialDueDate?: Date;
  initialTags?: string[];
  allTags: Tag[];
  bgVariant: "zinc-700" | "zinc-800";
  onCancel: () => void;
};

const tagInitial: TagActionState = { ok: false };

function toDateInputValue(date?: Date): string {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function TaskEditForm({
  taskId,
  initialTitle,
  initialMessage,
  initialDueDate,
  initialTags,
  allTags,
  bgVariant,
  onCancel,
}: TaskEditFormProps) {
  const inputBg = bgVariant === "zinc-700" ? "bg-zinc-800" : "bg-zinc-700";
  const tagUnselectedBg = bgVariant === "zinc-700" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-700 hover:bg-zinc-600";
  const [selectedTagNames, setSelectedTagNames] = useState<Set<string>>(
    () => new Set(initialTags ?? [])
  );
  const [showNewTag, setShowNewTag] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagState, tagFormAction, isTagPending] = useActionState(
    createTagAction,
    tagInitial
  );
  const [, startTagTransition] = useTransition();

  useEffect(() => {
    if (tagState.ok && tagInputRef.current) {
      tagInputRef.current.value = "";
    }
  }, [tagState]);

  function submitTag() {
    const fd = new FormData();
    fd.set("name", tagInputRef.current?.value ?? "");
    startTagTransition(() => {
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;
    const dueDate = (form.elements.namedItem("dueDate") as HTMLInputElement).value;
    const tags = Array.from(selectedTagNames);

    startTransition(async () => {
      await updateTask(taskId, title, message, dueDate, tags);
      onCancel();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 pt-5">
      <div className="flex flex-col gap-1">
        <label className="pl-1 text-xs text-zinc-300">Title</label>
        <input
          className={`w-full rounded-md ${inputBg} px-3 py-2 text-sm text-white`}
          name="title"
          placeholder="Title"
          defaultValue={initialTitle}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="pl-1 text-xs text-zinc-300">Message</label>
        <textarea
          className={`w-full resize-none rounded-md ${inputBg} px-3 py-2 text-sm text-white`}
          name="message"
          placeholder="Message (optional)"
          rows={3}
          defaultValue={initialMessage ?? ""}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowNewTag((v) => !v)}
          className={`rounded-md ${inputBg} px-2.5 py-2 text-xs text-zinc-200 hover:text-white`}
        >
          + Tag
        </button>
        {allTags.map((tag) => {
          const selected = selectedTagNames.has(tag.name);
          return (
            <span key={tag.id} className="group flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => toggleTag(tag.name)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  selected
                    ? "bg-zinc-200 text-zinc-900"
                    : `${tagUnselectedBg} text-zinc-300`
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
          <div className="flex items-center gap-1.5 basis-full">
            <input
              ref={tagInputRef}
              type="text"
              placeholder="New tag name"
              className={`w-[10rem] rounded-md ${inputBg} px-3 py-2 text-xs text-white`}
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
              onClick={submitTag}
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

      <div className="flex items-center gap-2">
        <span className="pl-1 text-sm text-zinc-300">Due date</span>
        <input
          type="date"
          name="dueDate"
          defaultValue={toDateInputValue(initialDueDate)}
          className={`rounded-md ${inputBg} px-3 py-2 text-sm text-zinc-200 [color-scheme:dark]`}
        />
      </div>

      <div className="flex items-center gap-2 pb-5 pt-3">
          <button
            type="submit"
            className={`rounded-md ${inputBg} px-3 py-2 text-sm text-zinc-100 hover:bg-neutral-100 hover:text-black disabled:opacity-60`}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-md ${inputBg} px-3 py-2 text-sm text-zinc-300 hover:text-red-600`}
            disabled={isPending}
          >
            Cancel
          </button>
      </div>
    </form>
  );
}
