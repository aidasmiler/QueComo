import { expect, test } from '@playwright/test';
import { backendEnabled, expectNoHorizontalOverflow, signUp, uniqueEmail } from './helpers';

// Runs against the shared TEST Supabase project only (never production). Enable with E2E_BACKEND=1.
test.describe('recipes (real backend)', () => {
  test.skip(!backendEnabled, 'Set E2E_BACKEND=1 to run against the test Supabase project');

  test('create, scale, favourite, edit, archive and delete a recipe', async ({ page }) => {
    await signUp(page, 'Cocina E2E', uniqueEmail('recipes'));
    await page.getByLabel('Nombre del hogar').fill('Casa recetas');
    await page.getByRole('button', { name: 'Crear hogar' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/recipes');
    await expect(page.getByText('Tu recetario está vacío')).toBeVisible();
    await page.getByRole('link', { name: 'Nueva receta' }).first().click();

    await page.getByLabel('Título').fill('Arroz E2E');
    await page.getByLabel('Raciones de la receta').fill('4');
    // New recipes start with paste boxes: everything at once, then split into rows.
    await page
      .getByLabel('Pega aquí los ingredientes')
      .fill('- 400 g de arroz\n2 cebollas\nSal al gusto');
    await page.getByRole('button', { name: 'Separar en 3 filas' }).click();
    await expect(page.getByLabel('Ingrediente 3')).toHaveValue('Sal al gusto');
    await expect(page.getByText('400 g · arroz')).toBeVisible();
    await page.getByLabel('Pega aquí los pasos').fill('1. Cocer el arroz.\n2. Servir.');
    await page.getByRole('button', { name: 'Separar en 2 filas' }).click();
    await expect(page.getByLabel('Paso 2')).toHaveValue('Servir.');
    await page.getByLabel('Activo (min)').fill('20');
    await page.getByLabel('Pasivo (min)').fill('25');
    // "Arroz" in the title: the classifier preselects the category (shown as added by QuéComo).
    await expect(page.getByRole('button', { name: 'Quitar Arroces y cereales' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Arroces y cereales', pressed: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Guardar receta' }).click();

    // Detail: scaling 4 → 2 halves numeric quantities and leaves "al gusto" alone.
    await expect(page.getByRole('heading', { name: 'Arroz E2E' })).toBeVisible();
    await expect(page.getByText('45 min')).toBeVisible();
    await page.getByRole('button', { name: 'Menos raciones' }).click();
    await page.getByRole('button', { name: 'Menos raciones' }).click();
    const ingredients = page.getByRole('list', { name: 'Ingredientes' });
    await expect(ingredients.getByRole('listitem').filter({ hasText: 'arroz' })).toContainText(
      '200',
    );
    await expect(ingredients.getByRole('listitem').filter({ hasText: 'cebollas' })).toContainText(
      '1',
    );
    await expect(page.getByText('Sal al gusto')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Añadir a favoritas' }).click();
    await expect(page.getByRole('button', { name: 'Quitar de favoritas' })).toBeVisible();

    // Edit keeps the data and saves changes.
    await page.getByRole('link', { name: 'Editar' }).click();
    await expect(page.getByLabel('Ingrediente 1')).toHaveValue('400 g de arroz');
    await page.getByLabel('Título').fill('Arroz E2E editado');
    await page.getByRole('button', { name: 'Guardar receta' }).click();
    await expect(page.getByRole('heading', { name: 'Arroz E2E editado' })).toBeVisible();

    // List, search and favourites filter.
    await page.getByRole('link', { name: 'Volver' }).click();
    await page.getByRole('button', { name: 'Favoritas' }).click();
    await expect(page.getByRole('link', { name: /Arroz E2E editado/ })).toBeVisible();
    await page.getByPlaceholder('Título, ingrediente o etiqueta').fill('lentejas');
    await expect(page.getByText('No hay recetas que coincidan')).toBeVisible();
    await page.getByRole('button', { name: 'Quitar filtros' }).click();

    // Archive, restore and delete.
    await page.getByRole('link', { name: /Arroz E2E editado/ }).click();
    await page.getByRole('button', { name: 'Archivar' }).click();
    await expect(page.getByText('Esta receta está archivada')).toBeVisible();
    await page.getByRole('button', { name: 'Restaurar' }).click();
    await expect(page.getByText('Esta receta está archivada')).toBeHidden();
    await page.getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByText('Tu recetario está vacío')).toBeVisible();
  });
});
