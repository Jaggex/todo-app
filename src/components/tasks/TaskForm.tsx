import { createTask } from "@/actions/tasks";

export function TaskForm() {
  return (
    <form action={createTask} className="space-y-2">
      <input
        className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
        name="title"
        placeholder="Title"
      />

      <textarea
        className="w-full resize-none rounded-md bg-zinc-800 px-3 py-2 text-sm text-white"
        name="message"
        placeholder="Message (optional)"
        rows={3}
      />

      <div className="flex items-center justify-between gap-3">
        <input
          type="date"
          name="dueDate"
          className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-400 [color-scheme:dark]"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
        >
          Add task
        </button>
      </div>
    </form>
  );
}
