import { expect, test } from '@playwright/test';
import { backendEnabled, expectNoHorizontalOverflow, signUp, uniqueEmail } from './helpers';

// Runs against the shared TEST Supabase project only (never production). Enable with E2E_BACKEND=1.
test.describe('smart classification (real backend)', () => {
  test.skip(!backendEnabled, 'Set E2E_BACKEND=1 to run against the test Supabase project');

  test('suggests, respects rejections and household keywords', async ({ page }) => {
    await signUp(page, 'Clasifica E2E', uniqueEmail('classify'));
    await page.getByLabel('Nombre del hogar').fill('Casa clasifica');
    await page.getByRole('button', { name: 'Crear hogar' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/recipes/new');
    await page.getByLabel('Título').fill('Crema de calabacín E2E');
    await page.getByLabel('Pega aquí los ingredientes').fill('2 calabacines\n1 patata\nsal');
    await page
      .getByLabel('Pega aquí los pasos')
      .fill('Cocer las verduras en una olla.\nTriturar con la batidora de mano.');

    // High confidence: preselected and shown as added by QuéComo.
    const soups = page.getByRole('button', { name: 'Sopas y cremas', exact: true, pressed: true });
    await expect(soups).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quitar Sopas y cremas' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // Rejecting it sticks, even after the content changes and is analysed again.
    await page.getByRole('button', { name: 'Quitar Sopas y cremas' }).click();
    await expect(
      page.getByRole('button', { name: 'Sopas y cremas', exact: true, pressed: false }),
    ).toBeVisible();
    await page.getByLabel('Título').fill('Crema de calabacín ligera E2E');
    await page.getByRole('button', { name: 'Volver a analizar' }).click();
    await expect(
      page.getByRole('button', { name: 'Sopas y cremas', exact: true, pressed: false }),
    ).toBeVisible();

    // Utensils are never added on their own: the person decides how each one is used.
    await expect(page.getByLabel('Sin especificar')).toBeChecked();
    await page.getByRole('combobox', { name: 'Batidora de mano' }).selectOption('required');
    await expect(page.getByLabel('Indicar utensilios')).toBeChecked();
    await page.getByRole('combobox', { name: 'Olla', exact: true }).selectOption('optional');

    await page.getByRole('button', { name: 'Guardar receta' }).click();
    await expect(
      page.getByRole('heading', { name: 'Crema de calabacín ligera E2E' }),
    ).toBeVisible();
    await expect(page.getByText('Batidora de mano', { exact: true })).toBeVisible();
    await expect(page.getByText('Utensilios opcionales')).toBeVisible();

    // Editing: the saved rejection is kept and nothing is changed by itself.
    await page.getByRole('link', { name: 'Editar' }).click();
    await page.getByLabel('Título').fill('Crema de calabacín E2E v2');
    await page.getByRole('button', { name: 'Volver a analizar' }).click();
    await expect(
      page.getByRole('button', { name: 'Sopas y cremas', exact: true, pressed: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Guardar receta' }).click();
    await expect(page.getByRole('heading', { name: 'Crema de calabacín E2E v2' })).toBeVisible();

    // Household keyword on a custom tag (owner only).
    await page.goto('/recipes/catalogs?tab=tag');
    await page.getByRole('button', { name: 'Nueva etiqueta' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre').fill('Cumple');
    await dialog.getByLabel('Palabras clave (opcional)').fill('tarta, celebración');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Palabras clave: tarta, celebración')).toBeVisible();

    await page.goto('/recipes/new');
    await page.getByLabel('Título').fill('Tarta de chocolate E2E');
    await expect(page.getByRole('button', { name: 'Quitar Cumple' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quitar Postres y repostería' })).toBeVisible();
  });
});
