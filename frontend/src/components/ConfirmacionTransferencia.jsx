"use client";

// H-10.2: muestra los materiales y las existencias antes de transferir.
// La pantalla que utiliza este componente consulta el inventario
// y ejecuta la confirmación mediante el backend.

export default function ConfirmacionTransferencia({
  solicitud,
  bodegaOrigen,
  bodegaDestino,
  materiales = [],
  cargando = false,
  procesando = false,
  error = "",
  onCancelar,
  onConfirmar,
}) {
  if (!solicitud) return null;

  const esCantidadValida = (valor) =>
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor >= 0;

  const bodegasValidas =
    Number.isInteger(bodegaOrigen?.id_bodega) &&
    bodegaOrigen.id_bodega > 0 &&
    Number.isInteger(bodegaDestino?.id_bodega) &&
    bodegaDestino.id_bodega > 0 &&
    bodegaOrigen.id_bodega !== bodegaDestino.id_bodega;

  const materialesValidos =
    materiales.length > 0 &&
    materiales.every(
      (material) =>
        Number.isInteger(material.id_material) &&
        material.id_material > 0 &&
        Number.isInteger(material.cantidad) &&
        material.cantidad > 0 &&
        esCantidadValida(material.stock_origen) &&
        esCantidadValida(material.stock_destino) &&
        material.stock_origen >= material.cantidad
    );

  const puedeConfirmar =
    solicitud.estado === "APROBADA" &&
    bodegasValidas &&
    materialesValidos &&
    !cargando &&
    !procesando &&
    !error &&
    typeof onConfirmar === "function";

  const mostrarStock = (valor) =>
    esCantidadValida(valor) ? valor : "Sin consultar";

  return (
    <section
      aria-labelledby="titulo-confirmacion-transferencia"
      aria-busy={cargando || procesando}
      className="overflow-hidden rounded-2xl bg-white shadow-lg"
    >
      <div className="bg-[#145c42] px-7 py-5 text-white">
        <h2
          id="titulo-confirmacion-transferencia"
          className="text-xl font-semibold"
        >
          Confirmar transferencia
        </h2>

        <p className="mt-1 text-sm text-white/75">
          Solicitud #{solicitud.id_solicitud}
        </p>
      </div>

      <div className="space-y-6 p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <p className="text-sm text-gray-500">Bodega de salida</p>
            <p className="mt-1 font-semibold text-[#173d30]">
              {bodegaOrigen?.nombre || "Sin identificar"}
            </p>
          </div>

          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <p className="text-sm text-gray-500">Bodega de recepción</p>
            <p className="mt-1 font-semibold text-[#173d30]">
              {bodegaDestino?.nombre || "Sin identificar"}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Revise los materiales, las cantidades y las existencias
          actuales antes de confirmar.
        </p>

        {cargando ? (
          <p role="status" className="text-sm text-gray-600">
            Consultando existencias...
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Materiales solicitados y existencias actuales por bodega
              </caption>

              <thead className="bg-[#edf4ef] text-[#173d30]">
                <tr>
                  <th scope="col" className="px-4 py-3">Material</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    A transferir
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Stock origen
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Stock destino
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Disponibilidad
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-gray-700">
                {materiales.map((material) => {
                  const consultado = esCantidadValida(
                    material.stock_origen
                  );

                  const cantidadValida =
                    Number.isInteger(material.cantidad) &&
                    material.cantidad > 0;

                  const suficiente =
                    consultado &&
                    cantidadValida &&
                    material.stock_origen >= material.cantidad;

                  return (
                    <tr key={material.id_material}>
                      <td className="px-4 py-3 font-medium">
                        {material.nombre}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {material.cantidad}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {mostrarStock(material.stock_origen)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {mostrarStock(material.stock_destino)}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          suficiente ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {!cantidadValida
                          ? "Cantidad inválida"
                          : !consultado
                            ? "Sin consultar"
                            : suficiente
                              ? "Disponible"
                              : "Stock insuficiente"}
                      </td>
                    </tr>
                  );
                })}

                {materiales.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No hay materiales para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {!cargando &&
  !error &&
  !procesando &&
  (
    solicitud.estado !== "APROBADA" ||
    !bodegasValidas ||
    !materialesValidos
  ) && (
          <p className="text-sm text-amber-800">
            Para confirmar se necesita una solicitud aprobada, bodegas
            válidas y distintas, y existencias consultadas con stock
            suficiente en el origen.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={() => {
              if (puedeConfirmar) onConfirmar();
            }}
            disabled={!puedeConfirmar}
            className="rounded-xl bg-[#145c42] px-6 py-3 font-semibold text-white hover:bg-[#0f4934] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? "Procesando..." : "Confirmar transferencia"}
          </button>
        </div>
      </div>
    </section>
  );
}