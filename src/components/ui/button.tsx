import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
        secondary: 'bg-primary-soft text-olive-800 hover:bg-olive-200',
        outline: 'border border-border bg-surface text-fg hover:bg-surface-muted',
        ghost: 'text-fg hover:bg-surface-muted',
        accent: 'bg-accent-strong text-white hover:bg-terracotta-700',
        danger: 'bg-danger text-white hover:bg-[#8f1e18]',
        dangerGhost: 'text-danger hover:bg-danger-soft',
      },
      size: {
        sm: 'min-h-9 px-3.5 text-sm',
        md: 'min-h-11 px-5 text-[0.95rem]',
        lg: 'min-h-13 px-6 text-base',
        icon: 'size-11',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="size-4" />}
          {children}
        </>
      )}
    </Comp>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants };
