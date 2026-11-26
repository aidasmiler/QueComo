const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const appEnv = (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'local';

export const env = {
  supabaseUrl: url ?? '',
  supabaseKey: key ?? '',
  appEnv: appEnv === 'production' || appEnv === 'preview' ? appEnv : 'local',
  isConfigured: Boolean(url && key),
} as const;
