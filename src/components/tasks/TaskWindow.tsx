import type { ReactNode } from "react";

type TaskWindowProps = {
  title?: string;
  description?: string;
  rightSlot?: ReactNode;
  children?: ReactNode;
};

export function TaskWindow({
  title,
  description,
  rightSlot,
  children,
}: TaskWindowProps) {
  return (
    <section className="rounded-lg bg-zinc-800">
      {(title || rightSlot) ? (
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-1">
            {title ? <h1 className="text-xl font-semibold text-white">{title}</h1> : null}
            {description ? (
              <p className="text-sm text-gray-300">{description}</p>
            ) : null}
          </div>

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      ) : null}

      <div className="p-4">{children}</div>
    </section>
  );
}
