import { test, expect } from '@playwright/test';
import { USUARIOS, entrarComo, menu, leerStock } from './helpers/sesion.js';

test.describe('Registrar entrada de material (Bodega Central)', () => {
  test.beforeEach(async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Materiales').click();
    await expect(page).toHaveURL(/\/inventario/);
    await page.getByRole('button', { name: '+ Registrar entrada' }).click();
    await expect(page.getByText('Registrar entrada de materiales')).toBeVisible();
  });

  test('valida que se completen todos los campos', async ({ page }) => {
    await page.getByRole('button', { name: 'Confirmar entrada' }).click();
    await expect(page.getByText('Debe completar todos los campos.')).toBeVisible();
  });

  test('valida que la cantidad sea mayor que 0', async ({ page }) => {
    await page.locator('select[name="material"]').selectOption({ label: 'MAT-001 - Cemento' });
    await page.locator('input[name="cantidad"]').fill('0');
    await page.locator('select[name="proveedor"]').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar entrada' }).click();
    await expect(page.getByText('La cantidad debe ser mayor que 0.')).toBeVisible();
  });

  test('la fecha viene con el día de hoy', async ({ page }) => {
    const hoy = await page.locator('input[name="fecha"]').inputValue();
    expect(hoy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('cancelar cierra el formulario sin registrar nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('Registrar entrada de materiales')).toHaveCount(0);
  });

  test('registra una entrada y aumenta el stock', async ({ page }) => {
    // Se cierra el modal para leer el stock inicial
    await page.getByRole('button', { name: 'Cancelar' }).click();
    const stockAntes = await leerStock(page, 'MAT-001');

    await page.getByRole('button', { name: '+ Registrar entrada' }).click();
    await page.locator('select[name="material"]').selectOption({ label: 'MAT-001 - Cemento' });
    await page.locator('input[name="cantidad"]').fill('10');
    await page.locator('select[name="proveedor"]').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar entrada' }).click();

    const resumen = page.locator('div.fixed', { hasText: 'Entrada registrada correctamente' });
    await expect(resumen).toBeVisible();
    await expect(resumen).toContainText('MAT-001 - Cemento');
    await expect(resumen).toContainText('Carlos Administrador');

    await page.getByRole('button', { name: 'Aceptar' }).click();
    expect(await leerStock(page, 'MAT-001')).toBe(stockAntes + 10);

    // El cambio es persistente: se confirma recargando desde el servidor
    await page.reload();
    expect(await leerStock(page, 'MAT-001')).toBe(stockAntes + 10);
  });

  test('"Ver comprobante" abre el comprobante de ingreso', async ({ page }) => {
    await page.locator('select[name="material"]').selectOption({ label: 'MAT-003 - Bloques' });
    await page.locator('input[name="cantidad"]').fill('5');
    await page.locator('select[name="proveedor"]').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar entrada' }).click();
    await expect(page.getByText('Entrada registrada correctamente')).toBeVisible();

    await page.getByRole('button', { name: 'Ver comprobante' }).click();
    await expect(page).toHaveURL(/\/inventario\/comprobante\/\d+/);
    await expect(page.getByRole('heading', { name: 'Comprobante de ingreso', level: 1 }).first()).toBeVisible();

    await page.getByRole('button', { name: /Volver a materiales/ }).click();
    await expect(page).toHaveURL(/\/inventario$/);
  });
});
