import type { ReactNode } from "react";

import { Sidebar } from "@/components/app-shell/Sidebar";
import { Topbar } from "@/components/app-shell/Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Topbar />
      <div className="flex-1 grid grid-cols-[16rem_1fr_16rem]">
        <Sidebar />
        <main className="min-w-0 p-6">{children}</main>
        <aside className="border-l border-dashed border-gray-200 bg-slate-900" />
      </div>
    </div>
  );
}
