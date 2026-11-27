import { Shapes, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './catalog-constants';
import type { CatalogItem } from './hooks';

export function CategoryIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && CATEGORY_ICONS[icon]) || Shapes;
  return <Icon aria-hidden="true" className={cn('size-4 shrink-0', className)} />;
}

export function CategoryBadge({ item, className }: { item: CatalogItem; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold',
        CATEGORY_COLORS[item.color ?? 'gray'] ?? CATEGORY_COLORS.gray,
        className,
      )}
    >
      <CategoryIcon icon={item.icon} />
      {item.name}
    </span>
  );
}

/** Manual tags are outlined; automatic ones are dashed with a sparkle so they read as computed. */
export function TagBadge({
  children,
  auto = false,
  title,
}: {
  children: ReactNode;
  auto?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex min-h-8 items-center gap-1 rounded-full border px-3 text-sm font-medium',
        auto
          ? 'border-primary/50 bg-primary-soft/50 border-dashed text-olive-800'
          : 'border-border bg-surface text-fg',
      )}
    >
      {auto && <Sparkles aria-hidden="true" className="size-3.5" />}
      {children}
    </span>
  );
}

/** Toggle chip used by pickers and filters. */
export function ToggleChip({
  pressed,
  onClick,
  children,
  className,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
        pressed
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-border bg-surface text-fg hover:bg-surface-muted',
        className,
      )}
    >
      {children}
    </button>
  );
}
