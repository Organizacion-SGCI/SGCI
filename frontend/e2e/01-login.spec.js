import { test, expect } from '@playwright/test';
import { USUARIOS, iniciarSesion } from './helpers/sesion.js';

test.describe('Login', () => {
  test('muestra el formulario de inicio de sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.locator('#correo')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeEnabled();
  });

  test('rechaza una contraseña incorrecta', async ({ page }) => {
    await page.goto('/');
    await page.locator('#correo').fill(USUARIOS.jefeBodega.correo);
    await page.locator('#password').fill('clave-equivocada');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.getByText(/credenciales.*incorrectas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('rechaza un usuario que no existe', async ({ page }) => {
    await page.goto('/');
    await page.locator('#correo').fill('nadie@sgci.com');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.getByText(/credenciales.*incorrectas/i)).toBeVisible();
  });

  test('no envía el formulario con los campos vacíos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(/\/$/);
    // El campo obligatorio queda marcado como inválido por el navegador
    const faltaValor = await page.locator('#correo').evaluate((el) => el.validity.valueMissing);
    expect(faltaValor).toBe(true);
  });

  for (const [clave, usuario] of Object.entries(USUARIOS)) {
    test(`inicia sesión correctamente: ${usuario.rol} (${clave})`, async ({ page }) => {
      await iniciarSesion(page, usuario);
      await expect(page.getByRole('heading', { name: 'Selección de Contexto' }).first()).toBeVisible();
    });
  }

  test('guarda token, usuario y cookie de rol al entrar', async ({ page, context }) => {
    await iniciarSesion(page, USUARIOS.jefeBodega);

    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    const usuario = await page.evaluate(() => JSON.parse(sessionStorage.getItem('usuario')));
    expect(token).toBeTruthy();
    expect(usuario.correo).toBe('carlos@sgci.com');
    expect(usuario.rol).toBe('Jefe de Bodega');

    const cookies = await context.cookies();
    const cookieRol = cookies.find((c) => c.name === 'usuario_rol');
    expect(decodeURIComponent(cookieRol.value)).toBe('Jefe de Bodega');
  });
});
