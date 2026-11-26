import { expect, test } from '@playwright/test';
import { backendEnabled, expectNoHorizontalOverflow, signUp, uniqueEmail } from './helpers';

// Runs against the shared TEST Supabase project only (never production). Requires email
// confirmation to be disabled there. Enable with E2E_BACKEND=1.
test.describe('households (real backend)', () => {
  test.skip(!backendEnabled, 'Set E2E_BACKEND=1 to run against the test Supabase project');
  test.describe.configure({ mode: 'serial' });

  test('owner creates a household, invites a member, the member joins; outsiders cannot', async ({
    browser,
  }) => {
    const owner = await (await browser.newContext()).newPage();
    await signUp(owner, 'Aída E2E', uniqueEmail('owner'));
    await expect(owner).toHaveURL(/\/welcome$/);
    await owner.getByLabel('Nombre del hogar').fill('Casa E2E');
    await owner.getByRole('button', { name: 'Crear hogar' }).click();
    await expect(owner).toHaveURL(/\/$/);
    await expect(owner.getByRole('heading', { name: /Aída E2E/ })).toBeVisible();
    await expectNoHorizontalOverflow(owner);

    // Invite from the household screen.
    await owner.getByRole('link', { name: 'Invitar a alguien' }).click();
    await owner.getByRole('button', { name: 'Invitar a alguien' }).click();
    const inviteUrl = await owner
      .getByRole('textbox', { name: 'Enlace de invitación' })
      .inputValue();
    expect(inviteUrl).toMatch(/\/invite\/[A-Za-z0-9_-]{40,}$/);
    await owner.getByRole('button', { name: 'Cerrar' }).first().click();

    // A second person opens the link as a guest, signs up and joins.
    const member = await (await browser.newContext()).newPage();
    await member.goto(new URL(inviteUrl).pathname);
    await member.getByRole('link', { name: 'Crear cuenta' }).click();
    await signUp(member, 'Pareja E2E', uniqueEmail('member'));
    await expect(member.getByText('Aída E2E te invita a unirte a «Casa E2E».')).toBeVisible();
    await member.getByRole('button', { name: 'Unirme al hogar' }).click();
    await expect(member).toHaveURL(/\/$/);
    await expect(
      member
        .getByRole('button', { name: /Casa E2E/ })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();

    // The same link can't be used twice.
    const outsider = await (await browser.newContext()).newPage();
    await signUp(outsider, 'Otra persona', uniqueEmail('outsider'));
    await expect(outsider).toHaveURL(/\/welcome$/);
    await outsider.goto(new URL(inviteUrl).pathname);
    await expect(outsider.getByText('Esta invitación ya se ha utilizado.')).toBeVisible();

    // The owner sees both members after reloading.
    await owner.reload();
    await expect(owner.getByText('Pareja E2E')).toBeVisible();
  });

  test('language preference is stored in the profile and survives a reload', async ({ page }) => {
    await signUp(page, 'Idioma E2E', uniqueEmail('lang'));
    await page.getByLabel('Nombre del hogar').fill('Hogar idioma');
    await page.getByRole('button', { name: 'Crear hogar' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/profile');
    await page.getByLabel('Idioma').selectOption('en-GB');
    await expect(page.getByText('Language updated')).toBeVisible();
    await page.evaluate(() => localStorage.removeItem('qc.locale'));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Idioma E2E' })).toBeVisible();
    await expect(page.getByText('Your account')).toBeVisible();
  });
});
