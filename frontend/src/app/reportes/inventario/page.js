"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Guard from "@/components/Guard";
import BotonesExportar from "@/components/BotonesExportar";

import { obtenerReporteInventario } from "@/services/reporteInventarioService";

// H-15.3: pantalla del reporte de inventario actual, con exportación a Excel y PDF

const FILTROS_INICIALES = {
  material: "",
  estado: "",
};

// Columnas de la tabla y de los archivos exportados
const COLUMNAS = [
  { titulo: "Código", campo: "codigo" },
  { titulo: "Material", campo: "material" },
  { titulo: "Categoría", campo: "categoria" },
  { titulo: "Bodega", campo: "bodega" },
  { titulo: "Unidad", campo: "unidad_medida" },
  { titulo: "Total entradas", campo: "total_entradas" },
  { titulo: "Total salidas", campo: "total_salidas" },
  { titulo: "Stock actual", campo: "stock_actual" },
  { titulo: "Stock mínimo", campo: "stock_minimo" },
  { titulo: "Estado", campo: "estado_texto" },
  { titulo: "Última actualización", campo: "actualizacion_texto" },
];

// La fecha llega en formato ISO osea se muestra en formato local
function formatearFecha(fecha) {
  if (!fecha) return "-";

  const date = new Date(fecha);

  if (isNaN(date.getTime())) return String(fecha);

  return date.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReporteInventarioPage() {
  return (
    <Guard
      permiso="generar_reporte"
      fallback={
        <main className="min-h-screen bg-[#f7f8f3] p-10">
          <p role="alert">No tiene permiso para consultar reportes.</p>

          <a
            href="/dashboard"
            className="mt-4 inline-block text-[#145c42] underline"
          >
            Volver al Dashboard
          </a>
        </main>
      }
    >
      <ReporteInventario />
    </Guard>
  );
}

function ReporteInventario() {
  const router = useRouter();

  const [sesion, setSesion] = useState(null);
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIALES });
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  // Valida sesión y contexto 
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
      const contexto = JSON.parse(sessionStorage.getItem("contexto") || "null");

      if (!token || !usuario) {
        router.replace("/");
        return;
      }

      const esBodega = contexto?.tipo_contexto === "BODEGA";
      const esProyecto = contexto?.tipo_contexto === "PROYECTO";
      const id = Number(
        esBodega ? contexto?.id_bodega : contexto?.id_proyecto
      );

      if (
        (!esBodega && !esProyecto) ||
        !Number.isSafeInteger(id) ||
        id <= 0
      ) {
        router.replace("/contexto");
        return;
      }

      setSesion({ usuario, contexto, token });
    } catch {
      router.replace("/contexto");
    }
  }, [router]);

  const cambiarFiltro = (event) => {
    const { name, value } = event.target;

    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: value,
    }));

    setError("");

    // Los resultados anteriores no corresponden a los filtros editados
    setResultado(null);
  };

  const limpiarFiltros = () => {
    setFiltros({ ...FILTROS_INICIALES });
    setResultado(null);
    setError("");
  };

  const consultarReporte = async (event) => {
    event.preventDefault();
    setError("");
    setResultado(null);

    try {
      setConsultando(true);

      const datos = await obtenerReporteInventario({
        contexto: sesion.contexto,
        filtros,
        token: sesion.token,
      });

      setResultado(datos);
    } catch (error) {
      console.error("Error al consultar el reporte:", error);
      setError(error.message);
    } finally {
      setConsultando(false);
    }
  };

  if (!sesion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
        <p className="text-[#145c42]">Cargando reportes...</p>
      </main>
    );
  }

  // Filas listas para la tabla y para exportar 
  const filas = (resultado?.materiales || []).map((material) => ({
    ...material,
    estado_texto: material.estado === "STOCK_BAJO" ? "Stock bajo" : "OK",
    actualizacion_texto: formatearFecha(material.fecha_ultima_actualizacion),
  }));

  // Texto de los filtros que se imprime en los archivos exportados
  const textoFiltros = resultado
    ? [
        `${resultado.contexto.tipo === "BODEGA" ? "Bodega" : "Proyecto"}: ${resultado.contexto.nombre}`,
        `Material: ${resultado.filtros.material || "Todos"}`,
        `Estado: ${
          resultado.filtros.estado === "STOCK_BAJO"
            ? "Stock bajo"
            : resultado.filtros.estado || "Todos"
        }`,
      ]
    : [];

  const campoClase =
    "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 " +
    "text-[#173d30] outline-none focus:border-[#145c42] " +
    "focus:ring-2 focus:ring-[#145c42]/20";

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      <Header usuario={sesion.usuario} titulo="Reportes" />
      <Sidebar usuario={sesion.usuario} activo="reportes" />

      <section className="min-h-screen pt-[120px] pl-[270px] pr-10 pb-12">
        <div className="mx-auto max-w-7xl">

          {/* ENCABEZADO */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#65907e]">
                Reportes de inventario
              </p>

              <h1 className="mt-1 text-3xl font-semibold text-[#173d30]">
                Inventario actual
              </h1>

              <p className="mt-2 text-gray-600">
                Existencias de {sesion.contexto.nombre} ({sesion.contexto.tipo_contexto})
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/reportes")}
              className="cursor-pointer rounded-xl border border-[#145c42] px-4 py-2 text-sm font-semibold text-[#145c42] transition hover:bg-[#dcefd7]"
            >
              Ver historial de movimientos
            </button>
          </div>

          {/* FILTROS */}
          <form
            onSubmit={consultarReporte}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="bg-[#145c42] px-7 py-5">
              <h2 className="text-lg font-semibold text-white">
                Filtros del reporte
              </h2>
            </div>

            <div className="grid gap-6 p-7 md:grid-cols-2">

              <label className="block text-sm font-semibold text-[#173d30]">
                Material (nombre o código)

                <input
                  type="text"
                  name="material"
                  value={filtros.material}
                  onChange={cambiarFiltro}
                  placeholder="Ej: cemento o MAT-001"
                  className={campoClase}
                />
              </label>

              <label className="block text-sm font-semibold text-[#173d30]">
                Estado

                <select
                  name="estado"
                  value={filtros.estado}
                  onChange={cambiarFiltro}
                  className={campoClase}
                >
                  <option value="">Todos</option>
                  <option value="OK">OK</option>
                  <option value="STOCK_BAJO">Stock bajo</option>
                </select>
              </label>

            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 px-7 py-5">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="cursor-pointer rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Limpiar
              </button>

              <button
                type="submit"
                disabled={consultando}
                className="cursor-pointer rounded-xl bg-[#145c42] px-7 py-3 font-semibold text-white transition hover:bg-[#0f4934] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {consultando ? "Consultando..." : "Consultar reporte"}
              </button>
            </div>
          </form>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
            >
              {error}
            </div>
          )}

          {/* RESULTADOS */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

            {!resultado && !consultando && !error && (
              <p className="p-7 text-gray-600">
                Seleccione los filtros y presione Consultar reporte.
              </p>
            )}

            {consultando && (
              <p className="p-7 text-gray-600">Consultando reporte...</p>
            )}

            {resultado && (
              <>
                {/* RESUMEN Y EXPORTACIÓN */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-6">

                  <p className="text-sm text-gray-600">
                    {resultado.resumen.total_materiales} material(es)
                    {resultado.resumen.con_stock_bajo > 0 &&
                      ` · ${resultado.resumen.con_stock_bajo} con stock bajo`}
                  </p>

                  <BotonesExportar
                    titulo="Reporte de inventario actual"
                    columnas={COLUMNAS}
                    filas={filas}
                    filtros={textoFiltros}
                    nombreArchivo={`reporte-inventario-${new Date().toISOString().slice(0, 10)}`}
                  />

                </div>

                {/* TABLA */}
                {filas.length === 0 ? (
                  <p className="p-7 text-gray-600">
                    No hay materiales para los filtros seleccionados.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">

                      <thead className="bg-[#145c42] text-white">
                        <tr>
                          {COLUMNAS.map((columna) => (
                            <th
                              key={columna.campo}
                              className="px-5 py-4 text-left text-sm font-semibold"
                            >
                              {columna.titulo}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {filas.map((fila) => (
                          <tr
                            key={`${fila.bodega}-${fila.codigo}`}
                            className={
                              fila.estado === "STOCK_BAJO"
                                ? "border-b border-red-100 bg-red-50"
                                : "border-b border-gray-100 hover:bg-[#f7f8f3]"
                            }
                          >
                            {COLUMNAS.map((columna) => (
                              <td
                                key={columna.campo}
                                className="px-5 py-3 text-sm text-gray-800"
                              >
                                {fila[columna.campo]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      </section>

    </main>
  );
}