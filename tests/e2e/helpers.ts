import { expect, type Page } from '@playwright/test';

/** True when E2E runs against a real (test) Supabase project with email confirmation disabled. */
export const backendEnabled = process.env.E2E_BACKEND === '1';

export function uniqueEmail(label: string) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return `qc-e2e-${label}-${id}@example.com`;
}

export const PASSWORD = 'quecomo-e2e-Passw0rd';

export async function signUp(page: Page, name: string, email: string) {
  await page.goto('/signup');
  await page.getByLabel('¿Cómo te llamamos?').fill(name);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
