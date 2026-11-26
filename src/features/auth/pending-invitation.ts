// Keeps the invitation token across sign-up / email confirmation so the user lands back on it.
const KEY = 'qc.pendingInvitation';

export function rememberInvitation(token: string) {
  try {
    sessionStorage.setItem(KEY, token);
    localStorage.setItem(KEY, token);
  } catch {
    // Storage unavailable: the user can reopen the invitation link manually.
  }
}

export function takePendingInvitation(): string | null {
  try {
    const token = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    return token;
  } catch {
    return null;
  }
}

export function peekPendingInvitation(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Extracts the token from a pasted invitation URL or a bare token. */
export function parseInvitationInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/invite\/([A-Za-z0-9_-]{20,100})/);
  if (match?.[1]) return match[1];
  return /^[A-Za-z0-9_-]{20,100}$/.test(trimmed) ? trimmed : null;
}
