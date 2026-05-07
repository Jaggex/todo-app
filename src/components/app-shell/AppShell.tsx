import type { ReactNode } from "react";

import { Sidebar } from "@/components/app-shell/Sidebar";
import { Topbar } from "@/components/app-shell/Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Topbar />
      <div className="flex-1 sm:grid sm:grid-cols-[5rem_1fr_5rem] lg:grid-cols-[16rem_1fr_16rem]">
        <div className="hidden sm:flex sm:flex-col sm:border-r sm:border-dashed sm:border-gray-200 sm:bg-zinc-900">
          <div className="hidden lg:flex lg:flex-col lg:flex-1">
            <Sidebar />
          </div>
        </div>
        <main className="min-w-0 p-4 lg:p-6">{children}</main>
        <aside className="hidden sm:block border-l border-dashed border-gray-200 bg-zinc-900" />
      </div>
    </div>
  );
}
