import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** Settings-style navigation row with a generous touch target. */
export function ListRow({
  to,
  icon: Icon,
  label,
  detail,
  trailing,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  detail?: string;
  trailing?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="hover:bg-surface-muted/70 flex min-h-14 items-center gap-3 px-4 py-2 transition-colors"
    >
      <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full">
        <Icon aria-hidden="true" className="size-[1.1rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {detail && <span className="text-fg-muted block truncate text-sm">{detail}</span>}
      </span>
      {trailing}
      <ChevronRight aria-hidden="true" className="text-fg-muted size-5 shrink-0" />
    </Link>
  );
}

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && (
        <h2 className="text-fg-muted px-1 font-sans text-sm font-semibold tracking-wide uppercase">
          {title}
        </h2>
      )}
      <div className="divide-border/70 border-border/70 bg-surface shadow-card divide-y overflow-hidden rounded-lg border">
        {children}
      </div>
    </section>
  );
}
