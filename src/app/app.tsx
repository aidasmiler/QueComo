import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { PwaUpdatePrompt } from '@/components/layout/pwa-update';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/features/auth/auth-context';
import { env } from '@/lib/env';
import { queryClient } from '@/lib/query/client';
import { router } from './router';

function MissingConfig() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl">QuéComo</h1>
        <p className="text-fg-muted mt-3">
          Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. See
          docs/development/LOCAL_SETUP.md.
        </p>
      </div>
    </div>
  );
}

export function App() {
  if (!env.isConfigured) return <MissingConfig />;
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
          <PwaUpdatePrompt />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
