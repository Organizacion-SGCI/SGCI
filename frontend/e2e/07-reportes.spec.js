import { test, expect } from '@playwright/test';
import { USUARIOS, entrarComo, menu } from './helpers/sesion.js';

test.describe('Reportes (Jefe de Bodega)', () => {
  test.beforeEach(async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
  });

  test('el menú Reportes abre el historial de movimientos', async ({ page }) => {
    await menu(page, 'Reportes').click();
    await expect(page).toHaveURL(/\/reportes$/);
    await expect(page.getByRole('heading', { name: 'Historial de movimientos' })).toBeVisible();
  });

  test('consulta el reporte de inventario actual', async ({ page }) => {
    await page.goto('/reportes/inventario');
    await expect(page.getByText('Filtros del reporte')).toBeVisible();

    await page.getByRole('button', { name: 'Consultar reporte' }).click();
    await expect(page.locator('tbody tr', { hasText: 'MAT-001' })).toBeVisible();
    for (const col of ['Total entradas', 'Total salidas', 'Stock actual', 'Stock mínimo']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });

  test('filtra por material', async ({ page }) => {
    await page.goto('/reportes/inventario');
    await page.getByPlaceholder('Ej: cemento o MAT-001').fill('cemento');
    await page.getByRole('button', { name: 'Consultar reporte' }).click();

    await expect(page.locator('tbody tr', { hasText: 'Cemento' })).toHaveCount(1);
    await expect(page.locator('tbody tr', { hasText: 'Arena' })).toHaveCount(0);
  });

  test('filtra por estado "Stock bajo" (la Bodega Central no tiene)', async ({ page }) => {
    await page.goto('/reportes/inventario');
    await page.locator('select[name="estado"]').selectOption('STOCK_BAJO');
    await page.getByRole('button', { name: 'Consultar reporte' }).click();
    await expect(page.getByText('No hay materiales para los filtros seleccionados.')).toBeVisible();
  });

  test('"Limpiar" borra los filtros', async ({ page }) => {
    await page.goto('/reportes/inventario');
    const campo = page.getByPlaceholder('Ej: cemento o MAT-001');
    await campo.fill('arena');
    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(campo).toHaveValue('');
  });

  test('exporta el reporte a Excel', async ({ page }) => {
    await page.goto('/reportes/inventario');
    await page.getByRole('button', { name: 'Consultar reporte' }).click();
    await expect(page.locator('tbody tr', { hasText: 'MAT-001' })).toBeVisible();

    const [descarga] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar a Excel' }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('exporta el reporte a PDF', async ({ page }) => {
    await page.goto('/reportes/inventario');
    await page.getByRole('button', { name: 'Consultar reporte' }).click();
    await expect(page.locator('tbody tr', { hasText: 'MAT-001' })).toBeVisible();

    const [descarga] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar a PDF' }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
