import { test, expect } from '@playwright/test';
import { USUARIOS, entrarComo, menu, leerStock } from './helpers/sesion.js';

// Flujo completo del negocio, con tres actores:
//   Ana (Encargado, Subbodega Norte)  -> crea la solicitud y recibe el pedido
//   Carlos (Jefe de Bodega, Central)  -> aprueba/rechaza y transfiere
// Los tests dependen unos de otros, por eso se ejecutan en serie.
test.describe.configure({ mode: 'serial' });

const CANTIDAD = 10;
const filaSolicitud = (page, id) =>
  page.locator('tbody tr', { hasText: new RegExp(`#${id}(?!\\d)`) }).first();
const filtroEstado = (page) => page.locator('select').first();

/** Crea una solicitud de Cemento desde el modal y devuelve su id. */
async function crearSolicitud(page, { prioridad = 'MEDIA' } = {}) {
  await page.getByRole('button', { name: '+ Solicitar material' }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo.locator('#solicitud-material')).toBeVisible();

  const valor = await dialogo
    .locator('#solicitud-material option', { hasText: 'Cemento' })
    .getAttribute('value');
  await dialogo.locator('#solicitud-material').selectOption(valor);
  await dialogo.locator('#solicitud-cantidad').fill(String(CANTIDAD));
  await dialogo.getByRole('button', { name: /Agregar material/ }).click();
  await expect(dialogo.getByText('Cemento').last()).toBeVisible();
  await dialogo.locator('#solicitud-prioridad').selectOption(prioridad);
  await dialogo.getByRole('button', { name: 'Enviar solicitud' }).click();

  await expect(dialogo.getByText('Solicitud enviada exitosamente')).toBeVisible();
  const texto = await dialogo.getByText(/Solicitud #\d+/).innerText();
  const id = Number(texto.match(/#(\d+)/)[1]);
  await dialogo.getByRole('button', { name: 'Aceptar' }).click();
  await expect(page.getByText(`La solicitud #${id} fue registrada correctamente.`)).toBeVisible();
  return id;
}

let idAprobada;
let idRechazada;
let stockNorteAntes;
let stockCentralAntes;

test.describe('Encargado: crear solicitudes', () => {
  test('valida el formulario de solicitud', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);
    await menu(page, 'Mis solicitudes').click();
    await expect(page.getByRole('heading', { name: 'Solicitudes de materiales' })).toBeVisible();

    await page.getByRole('button', { name: '+ Solicitar material' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.locator('#solicitud-material')).toBeVisible();

    // Los datos del solicitante y de la bodega vienen de la sesión (solo lectura)
    await expect(dialogo.locator('#solicitud-bodega')).toHaveValue(/Subbodega Norte/);
    await expect(dialogo.locator('#solicitud-central')).toHaveValue(/Central/);

    // Enviar sin materiales
    await dialogo.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(dialogo.getByRole('alert')).toHaveText('Agregue al menos un material al listado.');

    // Agregar sin elegir material
    await dialogo.getByRole('button', { name: /Agregar material/ }).click();
    await expect(dialogo.getByRole('alert')).toHaveText('Seleccione un material.');

    // Cantidad inválida
    await dialogo.locator('#solicitud-material').selectOption({ index: 1 });
    await dialogo.locator('#solicitud-cantidad').fill('0');
    await dialogo.getByRole('button', { name: /Agregar material/ }).click();
    await expect(dialogo.getByRole('alert')).toContainText(/cantidad/i);

    // Material elegido pero sin agregar al listado
    await dialogo.locator('#solicitud-cantidad').fill('5');
    await dialogo.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('Hay un material sin agregar');

    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('crea una solicitud que queda PENDIENTE', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);

    // Stock de Cemento en Norte antes de recibir el pedido
    await menu(page, 'Materiales').click();
    stockNorteAntes = await leerStock(page, 'MAT-001');

    await menu(page, 'Mis solicitudes').click();
    idAprobada = await crearSolicitud(page, { prioridad: 'ALTA' });

    const fila = filaSolicitud(page, idAprobada);
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('PENDIENTE');
    await expect(fila).toContainText('ALTA');
    await expect(fila).toContainText('Ana Encargada');

    // El Encargado no puede aprobar ni rechazar
    await expect(fila.getByRole('button', { name: 'Aprobar' })).toHaveCount(0);
    await expect(fila.getByRole('button', { name: 'Rechazar' })).toHaveCount(0);

    // Ver detalle
    await fila.getByRole('button', { name: 'Ver detalle' }).click();
    await expect(page.getByText('Total de ítems')).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'Cemento' }).last()).toContainText(String(CANTIDAD));
  });

  test('crea una segunda solicitud (para rechazarla)', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);
    await menu(page, 'Mis solicitudes').click();
    idRechazada = await crearSolicitud(page, { prioridad: 'BAJA' });
    expect(idRechazada).not.toBe(idAprobada);
  });
});

test.describe('Jefe de Bodega: revisar solicitudes', () => {
  test('rechaza una solicitud y exige el motivo', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Revisar solicitudes').click();

    const fila = filaSolicitud(page, idRechazada);
    await expect(fila).toBeVisible();
    await fila.getByRole('button', { name: 'Rechazar' }).click();

    await expect(page.getByRole('heading', { name: 'Rechazar solicitud' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar rechazo' }).click();
    await expect(page.getByText('Debe indicar el motivo del rechazo.')).toBeVisible();

    await page.getByPlaceholder('Ej: Material no disponible').fill('Prueba E2E: sin stock disponible');
    await page.getByRole('button', { name: 'Confirmar rechazo' }).click();

    await expect(
      page.getByText(`La solicitud #${idRechazada} fue rechazada correctamente.`)
    ).toBeVisible();
    await expect(filaSolicitud(page, idRechazada)).toHaveCount(0); // ya no está en PENDIENTE

    await filtroEstado(page).selectOption('RECHAZADA');
    await expect(filaSolicitud(page, idRechazada)).toContainText('RECHAZADA');
  });

  test('cancelar la decisión no cambia la solicitud', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Revisar solicitudes').click();

    await filaSolicitud(page, idAprobada).getByRole('button', { name: 'Aprobar' }).click();
    await expect(page.getByRole('heading', { name: 'Aprobar solicitud' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Aprobar solicitud' })).toHaveCount(0);
    await expect(filaSolicitud(page, idAprobada)).toContainText('PENDIENTE');
  });

  test('aprueba una solicitud', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Revisar solicitudes').click();

    await filaSolicitud(page, idAprobada).getByRole('button', { name: 'Aprobar' }).click();
    await expect(page.getByText(/Se notificará al solicitante/)).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar aprobación' }).click();

    await expect(
      page.getByText(`La solicitud #${idAprobada} fue aprobada correctamente.`)
    ).toBeVisible();

    await filtroEstado(page).selectOption('APROBADA');
    await expect(filaSolicitud(page, idAprobada)).toContainText('APROBADA');
  });

  test('el filtro por estado funciona', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);
    await menu(page, 'Revisar solicitudes').click();

    await filtroEstado(page).selectOption('RECHAZADA');
    await expect(filaSolicitud(page, idRechazada)).toBeVisible();
    await expect(filaSolicitud(page, idAprobada)).toHaveCount(0);

    await filtroEstado(page).selectOption('');
    await expect(filaSolicitud(page, idRechazada)).toBeVisible();
    await expect(filaSolicitud(page, idAprobada)).toBeVisible();
  });
});

test.describe('Transferencia y recepción', () => {
  test('el Jefe de Bodega transfiere el material de la solicitud aprobada', async ({ page }) => {
    await entrarComo(page, USUARIOS.jefeBodega);

    await menu(page, 'Materiales').click();
    stockCentralAntes = await leerStock(page, 'MAT-001');

    await menu(page, 'Transferencias').click();
    await expect(page).toHaveURL(/\/transferencias/);

    const codigo = `SOL-${String(idAprobada).padStart(3, '0')}`;
    const fila = page.locator('tbody tr', { hasText: codigo });
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('APROBADA');
    await fila.getByRole('button', { name: 'Transferir' }).click();

    await expect(page).toHaveURL(new RegExp(`/transferencias/${idAprobada}$`));
    await expect(page.getByRole('heading', { name: 'Detalle de transferencia' }).first()).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'Cemento' })).toContainText(String(CANTIDAD));
    await expect(page.getByText('Inventario suficiente para realizar la transferencia.')).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/\/transferencias$/);
    await expect(page.locator('tbody tr', { hasText: codigo })).toHaveCount(0);

    // La Bodega Central quedó con 10 sacos menos
    await menu(page, 'Materiales').click();
    expect(await leerStock(page, 'MAT-001')).toBe(stockCentralAntes - CANTIDAD);
  });

  test('un Encargado no puede abrir la pantalla de transferencias', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);
    await page.goto('/transferencias');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('el Encargado confirma la recepción y su inventario aumenta', async ({ page }) => {
    await entrarComo(page, USUARIOS.encargadoNorte);
    await menu(page, 'Mis solicitudes').click();

    await filtroEstado(page).selectOption('EN_TRANSITO');
    const fila = filaSolicitud(page, idAprobada);
    await expect(fila).toContainText('EN_TRANSITO');
    await fila.getByRole('button', { name: 'Recibir Pedido' }).click();

    await expect(page.getByRole('heading', { name: 'Confirmar Recepción' })).toBeVisible();
    await page.getByRole('button', { name: 'Sí, recibido' }).click();
    await expect(page.getByText(`El pedido #${idAprobada} fue recibido correctamente.`)).toBeVisible();

    await filtroEstado(page).selectOption('COMPLETADA');
    await expect(filaSolicitud(page, idAprobada)).toContainText('COMPLETADA');

    // La Subbodega Norte recibió el material
    await menu(page, 'Materiales').click();
    expect(await leerStock(page, 'MAT-001')).toBe(stockNorteAntes + CANTIDAD);
  });
});
