import { expect } from '@playwright/test';

// Usuarios del script database/data_prueba.sql (contraseña de todos: 123456)
export const USUARIOS = {
  jefeBodega: {
    correo: 'carlos@sgci.com',
    password: '123456',
    nombre: 'Carlos Administrador',
    rol: 'Jefe de Bodega',
    contexto: 'Bodega Central',
  },
  encargadoNorte: {
    correo: 'ana@sgci.com',
    password: '123456',
    nombre: 'Ana Encargada',
    rol: 'Encargado',
    contexto: 'Subbodega Norte',
  },
  encargadoSur: {
    correo: 'luis@sgci.com',
    password: '123456',
    nombre: 'Luis Encargado',
    rol: 'Encargado',
    contexto: 'Subbodega Sur',
  },
  jefaConstruccion: {
    correo: 'maria@sgci.com',
    password: '123456',
    nombre: 'María Construcción',
    rol: 'Jefa de Construcción',
    contexto: 'Proyecto Residencial A',
  },
};

/** Inicia sesión por la interfaz y espera la pantalla de contexto. */
export async function iniciarSesion(page, usuario) {
  await page.goto('/');
  await page.locator('#correo').fill(usuario.correo);
  await page.locator('#password').fill(usuario.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page).toHaveURL(/\/contexto/);
}

/** Elige una bodega o proyecto en /contexto y espera el dashboard. */
export async function seleccionarContexto(page, nombre) {
  await page.getByRole('button', { name: new RegExp(nombre) }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Contexto activo', { exact: true })).toBeVisible();
}

/** Login + selección de contexto en un solo paso. */
export async function entrarComo(page, usuario, contexto = usuario.contexto) {
  await iniciarSesion(page, usuario);
  await seleccionarContexto(page, contexto);
}

/** Opción del menú lateral (aside). */
export const menu = (page, texto) => page.locator('aside').getByText(texto);

/** Espera a que el menú termine de cargar los permisos. */
export async function esperarMenu(page) {
  await expect(menu(page, 'Materiales')).toBeVisible();
}

/** Lee el "Stock actual" (columna 7) de un material en /inventario. */
export async function leerStock(page, codigo) {
  const fila = page.locator('tbody tr', { hasText: codigo }).first();
  await expect(fila).toBeVisible();
  const texto = await fila.locator('td').nth(6).innerText();
  return parseInt(texto.replace(/[^\d]/g, ''), 10);
}
