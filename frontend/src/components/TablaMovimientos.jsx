"use client";

/*
 * H-15.3 — Tabla de movimientos históricos.
 *
 * Este componente solo presenta datos.
 * La consulta, los filtros y los permisos se manejan en reportes/page.js.
 *
 * Para integrar el backend:
 * - Pasar resultado.movimientos mediante la propiedad movimientos.
 * - Mantener los nombres del contrato documentado en reporteService.js.
 * - Si el backend devuelve otros nombres, adaptarlos en el servicio.
 * - id_movimiento debe ser único por fila.
 *
 * No se suman cantidades: pueden pertenecer a materiales
 * con unidades distintas, como sacos, metros o unidades.
 */

const ESTILOS_TIPO = {
  ENTRADA: "bg-green-100 text-green-800",
  SALIDA: "bg-orange-100 text-orange-800",
  TRANSFERENCIA: "bg-blue-100 text-blue-800",
};

const NOMBRES_TIPO = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  TRANSFERENCIA: "Transferencia",
};

const formatoFecha = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Costa_Rica",
});

const formatoCantidad = new Intl.NumberFormat("es-CR", {
  maximumFractionDigits: 6,
});

function mostrarTexto(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "—";
  }

  return String(valor);
}

function mostrarFecha(valor) {
  if (!valor) return "—";

  /*
   * El backend debe devolver fecha y hora ISO con zona horaria:
   * "2026-11-04T09:30:00-06:00" o "2026-11-04T15:30:00Z".
   *
   * No interpretamos fechas sin zona para evitar que cambien
   * según la configuración del equipo que consulta.
   */
  if (
    typeof valor !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(valor)
  ) {
    return "Fecha sin zona horaria";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "Fecha inválida";
  }

  return formatoFecha.format(fecha);
}

function mostrarCantidad(valor) {
  if (
    valor === null ||
    valor === undefined ||
    (typeof valor === "string" && valor.trim() === "")
  ) {
    return "—";
  }

  if (typeof valor !== "number" && typeof valor !== "string") {
    return "—";
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? formatoCantidad.format(numero)
    : "—";
}

export default function TablaMovimientos({ movimientos = [] }) {
  // Un formato inválido no debe confundirse con una consulta sin resultados.
  if (
    !Array.isArray(movimientos) ||
    movimientos.some(
      (movimiento) =>
        !movimiento ||
        typeof movimiento !== "object" ||
        Array.isArray(movimiento)
    )
  ) {
    return (
      <p role="alert" className="text-red-700">
        No se pueden mostrar los movimientos: el formato recibido es inválido.
      </p>
    );
  }

  if (movimientos.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="font-semibold text-[#173d30]">
          No se encontraron movimientos
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Pruebe otro rango de fechas o cambie los filtros.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Resultados del historial de movimientos">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#173d30]">
          Movimientos encontrados
        </h2>

        {/* Cuenta únicamente las filas recibidas.
            Si se agrega paginación de servidor, mostrar también
            el total informado por el backend. */}
        <span className="rounded-full bg-[#eaf4e5] px-3 py-1 text-sm text-[#145c42]">
          {movimientos.length} registro(s) mostrados
        </span>
      </div>

      <div
        role="region"
        aria-label="Tabla de movimientos; permite desplazamiento horizontal"
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-gray-200 focus-visible:outline-2 focus-visible:outline-[#145c42]"
      >
        <table className="w-full min-w-[1150px] text-left text-sm">
          <caption className="sr-only">
            Movimientos del contexto activo que coinciden con los filtros
            de la consulta.
          </caption>

          <thead className="bg-[#145c42] text-white">
            <tr>
              {[
                "N.º",
                "Fecha y hora (Costa Rica)",
                "Tipo",
                "Material",
                "Cantidad",
                "Unidad",
                "Origen",
                "Destino",
                "Responsable",
                "Observación",
              ].map((titulo) => (
                <th
                  key={titulo}
                  scope="col"
                  className={`px-4 py-4 font-semibold ${
                    titulo === "Cantidad" ? "text-right" : ""
                  }`}
                >
                  {titulo}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {movimientos.map((movimiento, indice) => (
              <tr
                key={movimiento.id_movimiento ?? `sin-id-${indice}`}
                className="text-[#173d30] odd:bg-white even:bg-[#f7f8f3] hover:bg-[#eaf4e5]"
              >
                <th
                  scope="row"
                  className="whitespace-nowrap px-4 py-4 font-semibold"
                >
                  {mostrarTexto(movimiento.id_movimiento)}
                </th>

                <td className="whitespace-nowrap px-4 py-4">
                  {mostrarFecha(movimiento.fecha_movimiento)}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      ESTILOS_TIPO[movimiento.tipo] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {NOMBRES_TIPO[movimiento.tipo] ||
                      mostrarTexto(movimiento.tipo)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <p className="font-semibold">
                    {mostrarTexto(movimiento.material)}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {mostrarTexto(movimiento.codigo_material)}
                  </p>
                </td>

                <td className="px-4 py-4 text-right tabular-nums">
                  {mostrarCantidad(movimiento.cantidad)}
                </td>

                <td className="px-4 py-4">
                  {mostrarTexto(movimiento.unidad_medida)}
                </td>

                <td className="px-4 py-4">
                  {mostrarTexto(movimiento.origen)}
                </td>

                <td className="px-4 py-4">
                  {mostrarTexto(movimiento.destino)}
                </td>

                <td className="px-4 py-4">
                  {mostrarTexto(movimiento.responsable)}
                </td>

                <td className="min-w-[200px] max-w-xs whitespace-pre-wrap break-words px-4 py-4">
                  {mostrarTexto(movimiento.observacion)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}