import { X } from 'lucide-react';
import { Dialog as D } from 'radix-ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Bottom sheet on phones, centred dialog from the `sm` breakpoint. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const { t } = useTranslation();
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="bg-charcoal-900/40 fixed inset-0 z-40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <D.Content
          className={cn(
            'bg-surface shadow-float pb-safe fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-xl focus:outline-none',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
            className,
          )}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div
            className="bg-border mx-auto mt-2 h-1.5 w-10 rounded-full sm:hidden"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              <D.Title className="font-display text-xl">{title}</D.Title>
              {description && (
                <D.Description className="text-fg-muted mt-1 text-sm">{description}</D.Description>
              )}
            </div>
            <D.Close
              className="text-fg-muted hover:bg-surface-muted -mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full"
              aria-label={t('actions.close')}
            >
              <X className="size-5" aria-hidden="true" />
            </D.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
          {footer && (
            <div className="border-border/60 flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
