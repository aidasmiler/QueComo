import { ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { usePhotoUrl } from './hooks';

/** Recipe photo from the private bucket (signed URL), with a warm placeholder when missing. */
export function RecipePhoto({
  path,
  alt,
  className,
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const url = usePhotoUrl(path);
  if (path && url.data) {
    return (
      <img
        src={url.data}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('bg-surface-muted object-cover', className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'to-terracotta-100 grid place-items-center bg-gradient-to-br from-olive-100 text-olive-600',
        path && url.isPending && 'animate-pulse',
        className,
      )}
    >
      <ChefHat aria-hidden="true" className="size-1/4 max-h-16 max-w-16 opacity-60" />
    </div>
  );
}
