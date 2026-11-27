import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
      <span className="bg-primary-soft text-primary grid size-14 place-items-center rounded-full">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-xl">{title}</h2>
      {body && <p className="text-fg-muted max-w-sm">{body}</p>}
      {action}
    </div>
  );
}
