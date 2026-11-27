import i18n from 'i18next';

/** Error codes raised by our SQL functions (see supabase/migrations). */
const SERVER_CODES = [
  'QC_NOT_AUTHENTICATED',
  'QC_FORBIDDEN',
  'QC_NOT_OWNER',
  'QC_INVALID_NAME',
  'QC_TOO_MANY_HOUSEHOLDS',
  'QC_TOO_MANY_INVITATIONS',
  'QC_INVITATION_INVALID',
  'QC_INVITATION_REVOKED',
  'QC_INVITATION_USED',
  'QC_INVITATION_EXPIRED',
  'QC_ALREADY_MEMBER',
  'QC_LAST_OWNER',
  'QC_USE_LEAVE',
  'QC_NOT_A_MEMBER',
  'QC_INVALID_TARGET',
  'QC_RECIPE_INGREDIENTS',
  'QC_RECIPE_STEPS',
  'QC_CATALOG_DUPLICATE',
  'QC_RECIPE_EQUIPMENT',
] as const;
export type ServerErrorCode = (typeof SERVER_CODES)[number];

const AUTH_CODES = [
  'invalid_credentials',
  'email_not_confirmed',
  'user_already_exists',
  'weak_password',
  'over_email_send_rate_limit',
  'over_request_rate_limit',
  'same_password',
] as const;
type AuthErrorCode = (typeof AUTH_CODES)[number];

export class AppError extends Error {
  constructor(
    readonly kind: 'server' | 'auth' | 'network' | 'unknown',
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function isNetworkError(message: string) {
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}

/** Normalises Supabase/PostgREST/Auth errors into an AppError with a stable code. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const raw = error as { message?: string; code?: string; name?: string } | null;
  const message = raw?.message ?? String(error);
  const serverCode = SERVER_CODES.find((code) => message.includes(code));
  if (serverCode) return new AppError('server', serverCode, message);
  if (raw?.code && (AUTH_CODES as readonly string[]).includes(raw.code)) {
    return new AppError('auth', raw.code, message);
  }
  if (raw?.name === 'AuthRetryableFetchError' || isNetworkError(message)) {
    return new AppError('network', null, message);
  }
  return new AppError('unknown', raw?.code ?? null, message);
}

/** Returns a localised, user-friendly message. Never shows raw technical errors. */
export function errorMessage(error: unknown): string {
  const t = i18n.t.bind(i18n);
  const appError = toAppError(error);
  if (appError.kind === 'server' && appError.code) {
    return t(`errors:${appError.code as ServerErrorCode}`);
  }
  if (appError.kind === 'auth' && appError.code) {
    return t(`errors:auth.${appError.code as AuthErrorCode}`);
  }
  if (appError.kind === 'network') return t('errors:network');
  return t('errors:generic');
}

/** Throws a normalised error when a Supabase response contains one. */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  // PostgREST only returns null data without an error for void RPCs, typed as undefined.
  return result.data as T;
}
