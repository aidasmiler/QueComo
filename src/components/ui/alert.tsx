import { AlertCircle, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: 'info' | 'error' | 'warning';
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === 'info' ? Info : AlertCircle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-md px-4 py-3 text-sm',
        tone === 'info' && 'bg-primary-soft text-olive-800',
        tone === 'error' && 'bg-danger-soft text-danger',
        tone === 'warning' && 'bg-warning-soft text-warning',
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
