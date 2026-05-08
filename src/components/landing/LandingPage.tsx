import Link from "next/link";

export function LandingPage() {
  return (
    <div className="flex flex-col gap-20 py-16 lg:py-24">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-8">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Your tasks.
            <br />
            Your team.
            <br />
            Under control.
          </h1>
          <p className="text-base lg:text-lg text-zinc-300 max-w-sm mx-auto leading-relaxed">
            Clean task management for individuals and teams. Create tasks, organize workspaces, and
            get things done together.
          </p>
          <p className="text-sm text-zinc-300 font-medium">Free to use.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Get started free
          </Link>
          <Link href="/signin" className="text-sm text-zinc-300 hover:text-white transition-colors">
            Sign in →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="flex justify-center">
        <div className="rounded-lg border border-dashed border-gray-200 bg-zinc-800/40 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl w-full">
          <div className="flex flex-col gap-2 text-center">
            <h3 className="text-sm font-semibold text-white">Personal tasks</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Keep a running list of everything on your plate. Add, reorder, and mark tasks done to
              stay focused.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-center">
            <h3 className="text-sm font-semibold text-white">Team workspaces</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Create shared workspaces and invite teammates by email. Collaborate without the
              clutter.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
