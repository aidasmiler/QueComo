import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers';

test.describe('public screens', () => {
  test('protected routes redirect to sign in', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();
  });

  test('sign-in form validates input before calling the server', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('no-es-un-correo');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByText('Introduce un correo válido.')).toBeVisible();
  });

  test('sign-up form requires a name and an 8-character password', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Contraseña').fill('corta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('Escribe tu nombre.')).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Usa al menos 8 caracteres.' }),
    ).toBeVisible();
  });

  test('language can be switched before signing in and is remembered', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Idioma').selectOption('en-GB');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await page.getByLabel('Language').selectOption('es-ES');
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();
  });

  test('invitation links ask guests to create an account or sign in', async ({ page }) => {
    await page.goto('/invite/abcdefghijklmnopqrstuvwxyz0123456789');
    await expect(page.getByRole('heading', { name: 'Invitación a un hogar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible();
    await page.getByRole('link', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('podrás unirte al hogar al que te han invitado')).toBeVisible();
  });

  test('auth screens fit small screens without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/login', '/signup', '/forgot-password']) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('web app manifest and icons are served', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    const json = (await manifest.json()) as { display: string; icons: { src: string }[] };
    expect(json.display).toBe('standalone');
    for (const icon of json.icons) expect((await request.get(icon.src)).ok()).toBeTruthy();
  });
});
