"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { joinWorkspaceAction } from "@/actions/workspaces";

export function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleJoin() {
    startTransition(async () => {
      const result = await joinWorkspaceAction(token);
      if (result.ok && result.workspaceId) {
        router.push(`/workspaces/${result.workspaceId}`);
      } else {
        // Let the parent re-render with error via router.refresh
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={isPending}
      className="rounded-md bg-zinc-700 px-4 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black disabled:opacity-60"
    >
      {isPending ? "Joining…" : "Join workspace"}
    </button>
  );
}
