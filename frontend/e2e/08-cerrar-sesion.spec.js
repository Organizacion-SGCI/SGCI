import { test, expect } from '@playwright/test';
import { USUARIOS, entrarComo } from './helpers/sesion.js';

test.describe('Cerrar sesión', () => {
  test.beforeEach(async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByText('¿Estás seguro que deseas salir del sistema?')).toBeVisible();
  });

  test('"Cancelar" mantiene la sesión', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('¿Estás seguro que deseas salir del sistema?')).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('confirmar limpia la sesión y vuelve al login', async ({ page, context }) => {
    await page.getByRole('button', { name: 'Sí, cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#correo')).toBeVisible();

    expect(await page.evaluate(() => sessionStorage.getItem('token'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('usuario'))).toBeNull();
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'usuario_rol')).toBeUndefined();

    // Ya no se puede entrar a pantallas protegidas
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/);
  });
});
