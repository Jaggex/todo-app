export function Topbar() {
  return (
    <header className="grid h-14 grid-cols-[16rem_1fr_16rem] border-b border-dashed border-gray-200 bg-slate-900">
      <div className="flex items-center justify-center border-r border-dashed border-gray-200 px-4">
        <div className="text-sm font-semibold tracking-tight text-white">Worktasks</div>
      </div>

      <div className="flex items-center px-6" />

      <div className="flex items-center justify-center border-l border-dashed border-gray-200 px-4">
        <div className="text-xs text-white">Signed out</div>
      </div>
    </header>
  );
}
