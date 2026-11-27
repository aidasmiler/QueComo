import { expect, test } from '@playwright/test';
import { backendEnabled, expectNoHorizontalOverflow, signUp, uniqueEmail } from './helpers';

// Runs against the shared TEST Supabase project only (never production). Enable with E2E_BACKEND=1.
test.describe('kitchen equipment and cooking history (real backend)', () => {
  test.skip(!backendEnabled, 'Set E2E_BACKEND=1 to run against the test Supabase project');

  test('equipment decides which recipes show, history feeds estimates', async ({ page }) => {
    await signUp(page, 'Equipo E2E', uniqueEmail('kitchen'));
    await page.getByLabel('Nombre del hogar').fill('Casa equipo');
    await page.getByRole('button', { name: 'Crear hogar' }).click();
    await expect(page).toHaveURL(/\/$/);

    // Quick setup: nothing is ticked by default; pick the microwave only.
    await page.goto('/kitchen');
    await expect(page.getByRole('heading', { name: 'Configuración rápida' })).toBeVisible();
    await page.getByRole('button', { name: 'Microondas' }).click();
    await page.getByRole('button', { name: 'Guardar 1 utensilio' }).click();
    await expect(page.getByText('1 marcado')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // A recipe that needs a Lékué steam case and a microwave.
    await page.goto('/recipes/new');
    await page.getByLabel('Título').fill('Salmón Lékué E2E');
    await page.getByLabel('Pega aquí los ingredientes').fill('2 lomos de salmón');
    await page.getByLabel('Pega aquí los pasos').fill('Cocinar 8 minutos.');
    await page.getByRole('button', { name: 'Pescados y mariscos' }).click();
    await page.getByRole('button', { name: 'Cena' }).click();
    await page.getByLabel('Indicar utensilios').check();
    await page.getByRole('button', { name: 'Elegir utensilios' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Buscar utensilios').fill('lékué');
    await dialog.getByLabel('Estuche de vapor Lékué').check();
    await dialog.getByPlaceholder('Buscar utensilios').fill('microondas');
    await dialog.getByLabel('Microondas').check();
    await dialog.getByRole('button', { name: 'Listo' }).click();
    await page.getByLabel('Total (min)').fill('15');
    await page.getByRole('button', { name: 'Guardar receta' }).click();

    await expect(page.getByRole('heading', { name: 'Salmón Lékué E2E' })).toBeVisible();
    const equipment = page.getByRole('heading', { name: 'Utensilios necesarios' }).locator('..');
    await expect(equipment).toContainText('Estuche de vapor Lékué');
    // Printed so a failure in CI shows what the card said (the report artifact is not always at hand).
    console.log('equipment card:', await equipment.innerText());
    await expect(page.getByText('Me falta equipamiento')).toBeVisible();
    await expect(page.getByText('Os falta: Estuche de vapor Lékué.')).toBeVisible();
    await expect(page.getByText('Muy rápida')).toBeVisible();

    // The list hides it by default, but it can be shown.
    await page.goto('/recipes');
    await expect(
      page.getByText('Las recetas que coinciden necesitan utensilios que no tenéis.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Mostrar todas' }).click();
    await expect(page.getByRole('heading', { name: 'Salmón Lékué E2E' })).toBeVisible();

    // Ticking the steam case makes it doable.
    await page.goto('/kitchen');
    // Saved to the server with an optimistic update, so assert the state instead of check().
    await page.getByLabel('Estuche de vapor Lékué').click();
    await expect(page.getByLabel('Estuche de vapor Lékué')).toBeChecked();
    await expect(page.getByText('2 marcados')).toBeVisible();
    await page.goto('/recipes');
    await expect(page.getByText('Puedo prepararla')).toBeVisible();

    // Utensil filter.
    await page.getByRole('button', { name: /^Filtros/ }).click();
    await page
      .getByLabel('Con un utensilio concreto')
      .selectOption({ label: 'Estuche de vapor Lékué' });
    await page.getByRole('button', { name: 'Ver 1 receta' }).click();
    await expect(
      page.getByRole('button', { name: 'Quitar filtro Con Estuche de vapor Lékué' }),
    ).toBeVisible();

    // Cooking history.
    await page.getByRole('link', { name: /Salmón Lékué E2E/ }).click();
    await page.getByRole('button', { name: 'He cocinado esta receta' }).click();
    await page.getByLabel('Tiempo total real (min)').fill('12');
    await page.getByRole('button', { name: 'Guardar registro' }).click();
    await expect(page.getByText('12 min en total')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
