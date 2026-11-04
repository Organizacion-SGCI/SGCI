"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Guard from "@/components/Guard";
import { consultarMovimientos } from "@/services/reporteService";

const FILTROS_INICIALES = {
  fecha_desde: "",
  fecha_hasta: "",
  tipo: "",
  material: "",
};

export default function ReportesPage() {
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
      <ReporteMovimientos />
    </Guard>
  );
}

function ReporteMovimientos() {
  const router = useRouter();
  const peticionActual = useRef(null);

  const [sesion, setSesion] = useState(null);
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIALES });
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

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

    // Evita actualizar la pantalla si el usuario sale durante una consulta.
    return () => peticionActual.current?.abort();
  }, [router]);

  const cambiarFiltro = (event) => {
    const { name, value } = event.target;

    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: value,
    }));

    setError("");

    // Los resultados anteriores no corresponden a los filtros editados.
    setResultado(null);
  };

  const limpiarFiltros = () => {
    peticionActual.current?.abort();
    setConsultando(false);
    setFiltros({ ...FILTROS_INICIALES });
    setResultado(null);
    setError("");
  };

  const buscarMovimientos = async (event) => {
    event.preventDefault();
    setError("");
    setResultado(null);

    if (
      filtros.fecha_desde &&
      filtros.fecha_hasta &&
      filtros.fecha_desde > filtros.fecha_hasta
    ) {
      setError("La fecha inicial no puede superar la fecha final.");
      return;
    }

    peticionActual.current?.abort();

    const controlador = new AbortController();
    peticionActual.current = controlador;

    try {
      setConsultando(true);

      const datos = await consultarMovimientos({
        contexto: sesion.contexto,
        filtros,
        token: sesion.token,
        signal: controlador.signal,
      });

      if (!controlador.signal.aborted) {
        setResultado(datos);
      }
    } catch (err) {
      if (!controlador.signal.aborted) {
        setError(err.message || "No se pudo consultar el reporte.");
      }
    } finally {
      if (!controlador.signal.aborted) {
        setConsultando(false);
      }
    }
  };

  if (!sesion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
        <p className="text-[#145c42]">Cargando reportes...</p>
      </main>
    );
  }

  const campoClase =
    "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 " +
    "text-[#173d30] outline-none focus:border-[#145c42] " +
    "focus:ring-2 focus:ring-[#145c42]/20";

  return (
    <main className="min-h-screen bg-[#f7f8f3]">
      <Header usuario={sesion.usuario} titulo="Reportes" />
      <Sidebar usuario={sesion.usuario} activo="reportes" />

      <section className="min-h-screen pt-[120px] pl-[270px] pr-10 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-[#65907e]">
              Reportes de inventario
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-[#173d30]">
              Historial de movimientos
            </h1>

            <p className="mt-2 text-gray-600">
              Consulte los movimientos del contexto seleccionado.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#c9dfc4] bg-[#eaf4e5] p-5">
            <div>
              <p className="text-xs font-semibold uppercase text-[#39715c]">
                Contexto activo
              </p>

              <p className="mt-1 font-semibold text-[#173d30]">
                {sesion.contexto.nombre}
              </p>

              <p className="mt-1 text-sm text-[#39715c]">
                {sesion.contexto.tipo_contexto}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/contexto")}
              className="rounded-xl border border-[#145c42] px-4 py-2 text-sm font-semibold text-[#145c42] hover:bg-[#dcefd7]"
            >
              Cambiar contexto
            </button>
          </div>

          <form
            onSubmit={buscarMovimientos}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="bg-[#145c42] px-7 py-5">
              <h2 className="text-lg font-semibold text-white">
                Filtros del reporte
              </h2>

              <p className="mt-1 text-sm text-white/80">
                Los filtros son opcionales y se pueden combinar.
              </p>
            </div>

            <fieldset
              disabled={consultando}
              className="p-7 disabled:opacity-70"
            >
              <legend className="sr-only">Filtros de movimientos</legend>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="text-sm font-semibold text-[#173d30]">
                  Desde
                  <input
                    type="date"
                    name="fecha_desde"
                    value={filtros.fecha_desde}
                    onChange={cambiarFiltro}
                    className={campoClase}
                  />
                </label>

                <label className="text-sm font-semibold text-[#173d30]">
                  Hasta
                  <input
                    type="date"
                    name="fecha_hasta"
                    value={filtros.fecha_hasta}
                    onChange={cambiarFiltro}
                    className={campoClase}
                  />
                </label>

                <label className="text-sm font-semibold text-[#173d30]">
                  Tipo de movimiento
                  <select
                    name="tipo"
                    value={filtros.tipo}
                    onChange={cambiarFiltro}
                    className={campoClase}
                  >
                    <option value="">Todos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-[#173d30]">
                  Material
                  <input
                    type="search"
                    name="material"
                    value={filtros.material}
                    onChange={cambiarFiltro}
                    placeholder="Nombre o código del material"
                    className={campoClase}
                  />
                </label>
              </div>

              {/* Texto libre: permite buscar materiales históricos
                  aunque ya no aparezcan en el inventario actual. */}

              <div className="mt-7 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Limpiar filtros
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#145c42] px-6 py-3 font-semibold text-white hover:bg-[#10583f]"
                >
                  {consultando ? "Consultando..." : "Consultar movimientos"}
                </button>
              </div>
            </fieldset>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
            >
              {error}
            </div>
          )}

          <div
            role="status"
            aria-live="polite"
            aria-busy={consultando}
            className="mt-6 rounded-2xl border border-gray-100 bg-white p-7 text-gray-600 shadow-sm"
          >
            {consultando && <p>Consultando movimientos...</p>}

            {!consultando && !error && !resultado && (
              <p>
                Seleccione los filtros y presione Consultar movimientos.
              </p>
            )}

            {resultado?.pendienteIntegracion && (
              <p>
                La consulta del historial todavía no está disponible.
                Los filtros están preparados, pero aún no se han consultado
                movimientos reales.
              </p>
            )}

            {resultado && !resultado.pendienteIntegracion && (
              resultado.movimientos.length === 0 ? (
                <p>No hay movimientos para los filtros seleccionados.</p>
              ) : (
                <p>
                  Se recibieron {resultado.movimientos.length} movimientos.
                  La tabla de resultados estará disponible próximamente.
                </p>
              )
            )}

            {/*
             * H-15.3 — Punto de integración de la tabla:
             *
             * Renderizar aquí el componente de resultados usando:
             * resultado.movimientos
             *
             * Mostrarlo solamente cuando exista resultado y
             * resultado.pendienteIntegracion sea false.
             *
             * La exportación deberá usar los mismos filtros
             * aplicados a la consulta, no nuevos valores sin consultar.
             */}
          </div>
        </div>
      </section>
    </main>
  );
}