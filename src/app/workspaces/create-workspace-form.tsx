"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createWorkspaceAction, type WorkspaceActionState } from "@/actions/workspaces";

const initial: WorkspaceActionState = { ok: false };

export function CreateWorkspaceForm() {
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initial);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.workspaceId) {
      router.push(`/workspaces/${state.workspaceId}`);
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="pl-1 text-xs text-zinc-400">Workspace name</label>
        <input
          name="name"
          className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500"
          required
          maxLength={80}
          disabled={isPending}
        />
      </div>

      {state.message && !state.ok ? (
        <p className="text-xs text-red-400">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-700 px-4 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}
