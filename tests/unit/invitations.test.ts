import { describe, expect, it } from 'vitest';
import { parseInvitationInput } from '@/features/auth/pending-invitation';

const token = 'AbC_dEf-123456789012345678901234567890abcd';

describe('parseInvitationInput', () => {
  it('extracts the token from a full invitation URL', () => {
    expect(parseInvitationInput(`https://quecomo-app.netlify.app/invite/${token}`)).toBe(token);
    expect(parseInvitationInput(`  https://x.test/invite/${token}?utm=1 `)).toBe(token);
  });

  it('accepts a bare token', () => {
    expect(parseInvitationInput(token)).toBe(token);
  });

  it('rejects anything else', () => {
    expect(parseInvitationInput('')).toBeNull();
    expect(parseInvitationInput('https://example.com/recipes/1')).toBeNull();
    expect(parseInvitationInput('short')).toBeNull();
    expect(parseInvitationInput('<script>alert(1)</script>')).toBeNull();
  });
});
