import { createTask } from "@/actions/tasks";

export function TaskForm() {
  return (
    <form action={createTask} className="flex items-center gap-2">
      <input
        className="min-w-0 flex-1 rounded-md bg-slate-800 px-3 py-[2px] text-sm text-white"
        name="title"
        placeholder="Task text"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-slate-800 px-3 py-[2px] text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
      >
        Add task
      </button>
    </form>
  );
}
