import { test, expect } from '@playwright/test';
import {
  USUARIOS, iniciarSesion, seleccionarContexto, entrarComo, menu, esperarMenu,
} from './helpers/sesion.js';

test.describe('Contexto de trabajo', () => {
  test('sin sesión, /contexto avisa que no hay sesión activa', async ({ page }) => {
    await page.goto('/contexto');
    await expect(page.getByText('No hay una sesión activa.')).toBeVisible();
  });

  test('sin sesión, /dashboard redirige al login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#correo')).toBeVisible();
  });

  test('el Jefe de Bodega solo ve la Bodega Central', async ({ page }) => {
    await iniciarSesion(page, USUARIOS.jefeBodega);
    await expect(page.getByRole('button', { name: /Bodega Central/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Subbodega/ })).toHaveCount(0);
  });

  test('el Encargado solo ve su subbodega', async ({ page }) => {
    await iniciarSesion(page, USUARIOS.encargadoNorte);
    await expect(page.getByRole('button', { name: /Subbodega Norte/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Subbodega Sur/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Bodega Central/ })).toHaveCount(0);
  });

  test('la Jefa de Construcción ve sus tres proyectos', async ({ page }) => {
    await iniciarSesion(page, USUARIOS.jefaConstruccion);
    await expect(page.getByRole('button', { name: /Proyecto Residencial A/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Proyecto Comercial B/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Proyecto Habitacional C/ })).toBeVisible();
  });

  test('sin elegir contexto no deja abrir otras pantallas', async ({ page }) => {
    await iniciarSesion(page, USUARIOS.jefeBodega);
    await menu(page, 'Materiales').click();
    await expect(
      page.getByText('Primero seleccione una bodega o proyecto para continuar.')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/contexto/);
  });

  test('al elegir una bodega muestra el dashboard con su contexto', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await expect(
      page.getByRole('heading', { name: /Bienvenido, Carlos Administrador/ })
    ).toBeVisible();
    await expect(page.getByText('Contexto actual')).toBeVisible();
    await expect(page.getByText(/BODEGA/i).first()).toBeVisible();
  });

  test('"Cambiar contexto" regresa a la selección', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await page.getByRole('button', { name: 'Cambiar contexto' }).click();
    await expect(page).toHaveURL(/\/contexto/);
  });
});

test.describe('Menú según el rol', () => {
  test('Jefe de Bodega', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await esperarMenu(page);
    for (const opcion of ['Emitir Vale', 'Reportes', 'Transferencias', 'Revisar solicitudes']) {
      await expect(menu(page, opcion)).toBeVisible();
    }
    await expect(menu(page, 'Mis solicitudes')).toHaveCount(0);
  });

  test('Encargado', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);
    await esperarMenu(page);
    await expect(menu(page, 'Mis solicitudes')).toBeVisible();
    for (const opcion of ['Emitir Vale', 'Reportes', 'Transferencias', 'Revisar solicitudes']) {
      await expect(menu(page, opcion)).toHaveCount(0);
    }
  });

  test('Jefa de Construcción', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefaConstruccion);
    await esperarMenu(page);
    await expect(menu(page, 'Emitir Vale')).toBeVisible();
    await expect(menu(page, 'Reportes')).toBeVisible();
    for (const opcion of ['Transferencias', 'Mis solicitudes', 'Revisar solicitudes']) {
      await expect(menu(page, opcion)).toHaveCount(0);
    }
  });
});

// Protección de rutas del middleware (frontend/src/middleware.ts)
test.describe('Middleware de rutas por rol', () => {
  test('un Encargado no puede entrar a /dashboard/transferencias', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);
    await page.goto('/dashboard/transferencias');
    await expect(page).toHaveURL(/\/dashboard\?error=sin-permiso/);
  });

  test('sin cookie de rol se redirige al login', async ({ page, context }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await context.clearCookies();
    await page.goto('/dashboard/reportes');
    await expect(page).toHaveURL(/\/$/);
  });
});
