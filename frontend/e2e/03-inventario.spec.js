import { test, expect } from '@playwright/test';
import { USUARIOS, entrarComo, menu } from './helpers/sesion.js';

test.describe('Inventario - Bodega Central (Jefe de Bodega)', () => {
  test.beforeEach(async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Materiales').click();
    await expect(page).toHaveURL(/\/inventario/);
  });

  test('muestra los materiales de la bodega', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Materiales' }).first()).toBeVisible();
    await expect(page.getByText('Inventario disponible en Bodega Central')).toBeVisible();
    for (const codigo of ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005']) {
      await expect(page.locator('tbody tr', { hasText: codigo })).toBeVisible();
    }
    await expect(page.getByText('Mostrando 5 de 5 materiales')).toBeVisible();
  });

  test('la tabla tiene las columnas esperadas', async ({ page }) => {
    for (const col of ['Código', 'Material', 'Bodega', 'Stock actual', 'Stock mínimo', 'Unidad', 'Estado']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });

  test('busca por nombre de material', async ({ page }) => {
    await page.getByPlaceholder('Buscar por código, material o tipo...').fill('cemento');
    await expect(page.getByText('Mostrando 1 de 5 materiales')).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'Cemento' })).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'Arena' })).toHaveCount(0);
  });

  test('busca por código', async ({ page }) => {
    await page.getByPlaceholder('Buscar por código, material o tipo...').fill('MAT-003');
    await expect(page.locator('tbody tr', { hasText: 'Bloques' })).toBeVisible();
    await expect(page.getByText('Mostrando 1 de 5 materiales')).toBeVisible();
  });

  test('busca por tipo', async ({ page }) => {
    await page.getByPlaceholder('Buscar por código, material o tipo...').fill('Construcción');
    await expect(page.getByText('Mostrando 5 de 5 materiales')).toBeVisible();
  });

  test('una búsqueda sin coincidencias no muestra materiales', async ({ page }) => {
    await page.getByPlaceholder('Buscar por código, material o tipo...').fill('zzzz-no-existe');
    await expect(page.getByText('Mostrando 0 de 5 materiales')).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'MAT-' })).toHaveCount(0);
  });
});

test.describe('Inventario - Stock bajo (Subbodega Sur)', () => {
  // En los datos de prueba, Subbodega Sur tiene Arena (40 < 50) y Piedra (20 < 30) bajo el mínimo.
  test('marca los materiales con stock bajo', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoSur);
    await menu(page, 'Materiales').click();

    await expect(page.getByText('2 con stock bajo')).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'MAT-002' })).toContainText('Stock bajo');
    await expect(page.locator('tbody tr', { hasText: 'MAT-005' })).toContainText('Stock bajo');
    await expect(page.locator('tbody tr', { hasText: 'MAT-001' })).not.toContainText('Stock bajo');
  });

  test('el Encargado ve solo el inventario de su bodega y no tiene el menú de reportes', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoSur);
    await menu(page, 'Materiales').click();
    await expect(page.getByText('Inventario disponible en Subbodega Sur')).toBeVisible();
    await expect(menu(page, 'Reportes')).toHaveCount(0);
  });
});
