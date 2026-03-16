import Link from "next/link";

const navItems = [
  { href: "/", label: "Tasks" },
  { href: "/completed", label: "Completed" },
];

export function Sidebar() {
  return (
    <aside className="border-r border-dashed border-gray-200 bg-slate-900 p-4">

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-neutral-100 hover:text-black"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
