import { cn } from '@/lib/utils/cn';

export function LogoMark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('size-9', className)}>
      <rect width="64" height="64" rx="16" fill={inverse ? '#F8F5ED' : '#50634A'} />
      <path d="M13 33h38a19 19 0 0 1-38 0z" fill={inverse ? '#50634A' : '#F8F5ED'} />
      <rect
        x="24"
        y="52.5"
        width="16"
        height="3.5"
        rx="1.75"
        fill={inverse ? '#50634A' : '#F8F5ED'}
      />
      <path
        d="M26.5 15.5a5.5 5.5 0 1 1 7.7 5c-1.5.7-2.2 1.7-2.2 3.3v.8"
        fill="none"
        stroke="#C47859"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="32" cy="29.6" r="2.3" fill="#C47859" />
    </svg>
  );
}

export function Logo({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark inverse={inverse} />
      <span
        className={cn(
          'font-display text-2xl font-semibold tracking-tight',
          inverse ? 'text-cream-50' : 'text-primary',
        )}
      >
        Qué<span className={inverse ? 'text-terracotta-200' : 'text-accent-strong'}>Como</span>
      </span>
    </span>
  );
}
