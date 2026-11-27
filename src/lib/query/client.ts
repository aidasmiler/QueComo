import { QueryClient } from '@tanstack/react-query';
import { toAppError } from '@/lib/supabase/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        const appError = toAppError(error);
        // Permission and validation errors won't fix themselves; only retry transient failures.
        if (appError.kind === 'server' || appError.kind === 'auth') return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});
