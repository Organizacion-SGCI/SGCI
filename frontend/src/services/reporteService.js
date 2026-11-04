const API_URL = "http://127.0.0.1:8000";

/*
 * H-15.2 — Integración pendiente con el backend.
 *
 * En el proyecto recibido todavía no existe una consulta de
 * movimientos históricos.
 *
 * Cuando esté disponible:
 * 1. Confirmar la ruta y asignarla a ENDPOINT_MOVIMIENTOS.
 * 2. Acordar los parámetros descritos abajo.
 * 3. Si la respuesta tiene otra estructura, adaptarla aquí.
 *
 * No activar la ruta hasta que exista el endpoint.
 */
const ENDPOINT_MOVIMIENTOS = null;

/*
 * CONTRATO PROPUESTO, pendiente de confirmar con backend:
 *
 * Método: GET
 * Autenticación: Authorization: Bearer <token>
 *
 * Parámetros:
 * - id_bodega O id_proyecto: contexto seleccionado, nunca ambos.
 * - fecha_desde: YYYY-MM-DD, opcional.
 * - fecha_hasta: YYYY-MM-DD, opcional.
 * - tipo: ENTRADA, SALIDA o TRANSFERENCIA, opcional.
 * - material: búsqueda por nombre o código, opcional.
 *
 * Reglas que debe aplicar el backend:
 * - Validar el token y el permiso generar_reporte.
 * - Verificar acceso al contexto; recibir su ID no autoriza acceso.
 * - Aplicar todos los filtros combinados.
 * - Incluir todo el día de fecha_hasta en la zona horaria acordada.
 * - En bodegas, contemplar movimientos de origen y de destino.
 * - Definir cómo se relacionan los movimientos con los proyectos.
 * - Acordar paginación antes de manejar historiales grandes.
 *
 * Respuesta propuesta:
 * {
 *   movimientos: [
 *     {
 *       id_movimiento: 1,
 *       fecha_movimiento: "2026-11-04T09:30:00-06:00",
 *       tipo: "ENTRADA",
 *       codigo_material: "MAT-001",
 *       material: "Cemento",
 *       cantidad: 10,
 *       unidad_medida: "Saco",
 *       origen: null,
 *       destino: "Bodega Central",
 *       responsable: "Carlos Administrador",
 *       observacion: null
 *     }
 *   ]
 * }
 *
 * Sin coincidencias: { movimientos: [] }.
 * Un error HTTP debe seguir siendo un error, no una lista vacía.
 */

export async function consultarMovimientos({
  contexto,
  filtros,
  token,
  signal,
}) {
  if (!token) {
    throw new Error("La sesión no está disponible. Inicie sesión nuevamente.");
  }

  const esBodega = contexto?.tipo_contexto === "BODEGA";
  const esProyecto = contexto?.tipo_contexto === "PROYECTO";

  const idContexto = Number(
    esBodega ? contexto?.id_bodega : contexto?.id_proyecto
  );

  if (
    (!esBodega && !esProyecto) ||
    !Number.isSafeInteger(idContexto) ||
    idContexto <= 0
  ) {
    throw new Error("Seleccione una bodega o proyecto válido.");
  }

  if (
    filtros.fecha_desde &&
    filtros.fecha_hasta &&
    filtros.fecha_desde > filtros.fecha_hasta
  ) {
    throw new Error("La fecha inicial no puede superar la fecha final.");
  }

  // Estado explícito: todavía no se ha consultado el historial real.
  if (!ENDPOINT_MOVIMIENTOS) {
    return { pendienteIntegracion: true, movimientos: [] };
  }

  const parametros = new URLSearchParams({
    [esBodega ? "id_bodega" : "id_proyecto"]: String(idContexto),
  });

  for (const campo of [
    "fecha_desde",
    "fecha_hasta",
    "tipo",
    "material",
  ]) {
    const valor = filtros[campo]?.trim();

    if (valor) {
      parametros.set(campo, valor);
    }
  }

  const respuesta = await fetch(
    `${API_URL}${ENDPOINT_MOVIMIENTOS}?${parametros.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
      cache: "no-store",
    }
  );

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("La sesión expiró. Inicie sesión nuevamente.");
    }

    if (respuesta.status === 403) {
      throw new Error("No tiene permiso para consultar este reporte.");
    }

    throw new Error("No se pudo consultar el historial. Intente nuevamente.");
  }

  const datos = await respuesta.json();

  if (!Array.isArray(datos.movimientos)) {
    throw new Error("El servidor devolvió un formato de reporte inesperado.");
  }

  return {
    pendienteIntegracion: false,
    movimientos: datos.movimientos,
  };
}