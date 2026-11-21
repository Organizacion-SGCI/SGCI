import { test, expect } from '@playwright/test';
import { USUARIOS, entrarComo, menu, leerStock } from './helpers/sesion.js';

test.describe('Emitir vale de salida (Bodega Central)', () => {
  test.beforeEach(async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Emitir Vale').click();
    await expect(page).toHaveURL(/\/salida/);
    await expect(page.getByRole('heading', { name: 'Emitir vale de materiales' }).first()).toBeVisible();
  });

  test('la fecha y el responsable no se pueden editar', async ({ page }) => {
    await expect(page.locator('input[type="date"]')).toBeDisabled();
    const responsable = page.locator('input[readonly][type="text"]');
    await expect(responsable).toHaveValue('Carlos Administrador');
  });

  test('exige completar los campos obligatorios', async ({ page }) => {
    await page.getByRole('button', { name: 'Emitir Vale' }).click();
    await expect(page.getByText('Debe completar todos los campos obligatorios.')).toBeVisible();
  });

  test('muestra la disponibilidad al elegir un material', async ({ page }) => {
    await page.locator('select[name="id_material"]').selectOption({ label: 'MAT-001 - Cemento' });
    await expect(page.getByText(/Disponible:\s*\d+\s*Saco/)).toBeVisible();
  });

  test('no permite sacar más de lo disponible', async ({ page }) => {
    await page.locator('select[name="id_material"]').selectOption({ label: 'MAT-001 - Cemento' });
    await page.locator('input[name="cantidad"]').fill('999999');
    await page.locator('select[name="id_proyecto"]').selectOption({ label: 'Proyecto Residencial A' });
    await page.getByRole('button', { name: 'Emitir Vale' }).click();
    await expect(page.getByText(/supera|insuficiente|no hay suficiente/i)).toBeVisible();
  });

  test('"Cancelar" limpia el formulario', async ({ page }) => {
    await page.locator('input[name="cantidad"]').fill('7');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.locator('input[name="cantidad"]')).toHaveValue('');
  });

  test('emite un vale y descuenta el inventario', async ({ page }) => {
    // Stock inicial
    await menu(page, 'Materiales').click();
    const stockAntes = await leerStock(page, 'MAT-001');
    await menu(page, 'Emitir Vale').click();

    await page.locator('select[name="id_material"]').selectOption({ label: 'MAT-001 - Cemento' });
    await page.locator('input[name="cantidad"]').fill('5');
    await page.locator('select[name="id_proyecto"]').selectOption({ label: 'Proyecto Residencial A' });
    await page.locator('textarea[name="observacion"]').fill('Prueba E2E - vale de salida');
    await page.getByRole('button', { name: 'Emitir Vale' }).click();

    // Vale generado
    const vale = page.locator('div.fixed', { hasText: 'Vale Registrado' });
    await expect(vale).toBeVisible();
    await expect(vale).toContainText('MAT-001 - Cemento');
    await expect(vale).toContainText('5 Saco');
    await expect(vale).toContainText('Proyecto Residencial A');
    await expect(vale).toContainText('Carlos Administrador');
    await expect(vale).toContainText('Stock actual del material');

    // "Emitir otro Vale" deja el formulario limpio
    await page.getByRole('button', { name: 'Emitir otro Vale' }).click();
    await expect(page.getByText('Vale Registrado')).toHaveCount(0);
    await expect(page.locator('input[name="cantidad"]')).toHaveValue('');

    // El inventario quedó 5 unidades abajo
    await menu(page, 'Materiales').click();
    expect(await leerStock(page, 'MAT-001')).toBe(stockAntes - 5);
  });
});

test.describe('Emitir vale desde un proyecto', () => {
  test('desde un contexto de proyecto avisa que se necesita una bodega', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefaConstruccion);
    await menu(page, 'Emitir Vale').click();
    await expect(
      page.getByText('El contexto seleccionado no corresponde a una bodega.')
    ).toBeVisible();
  });
});
