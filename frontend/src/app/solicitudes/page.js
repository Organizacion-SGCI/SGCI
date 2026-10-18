"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Guard from "@/components/Guard";
import ModalDecisionSolicitud from "@/components/ModalDecisionSolicitud";

import { obtenerSolicitudes } from "@/services/solicitudService";

// H-05.3: pantalla de gestión de solicitudes.
// El Jefe de Bodega ve las solicitudes dirigidas a sus bodegas y puede aprobarlas o rechazarlas

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

// Colores de las etiquetas de estado y prioridad
const COLOR_ESTADO = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
};

const COLOR_PRIORIDAD = {
  BAJA: "bg-gray-100 text-gray-600",
  MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700",
  URGENTE: "bg-red-100 text-red-700",
};

export default function Solicitudes() {
  const router = useRouter();

  const [usuario, setUsuario] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);

  // Por defecto se muestran las pendientes 
  const [filtroEstado, setFiltroEstado] = useState("PENDIENTE");

  // Solicitud con el detalle desplegado 
  const [detalleAbierto, setDetalleAbierto] = useState(null);

  // Decision en curso
  const [decision, setDecision] = useState(null);

  // Numero que cambia para volver a pedir la lista después de una decision
  const [recarga, setRecarga] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const contextoGuardado = sessionStorage.getItem("contexto");
        const usuarioGuardado = sessionStorage.getItem("usuario");

        if (usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }

        if (!token) {
          router.push("/");
          return;
        }

        if (!contextoGuardado) {
          router.push("/contexto");
          return;
        }

        setError("");

        const datos = await obtenerSolicitudes(filtroEstado, token);

        setSolicitudes(datos);
      } catch (error) {
        console.error("Error al cargar solicitudes:", error);
        setSolicitudes([]);
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarSolicitudes();
  }, [router, filtroEstado, recarga]);

  // Se ejecuta cuando el backend confirma la aprobación o el rechazo
  const decisionConfirmada = (resultado) => {
    const textoAccion =
      resultado.estado === "APROBADA" ? "aprobada" : "rechazada";

    setMensaje(
      `La solicitud #${resultado.id_solicitud} fue ${textoAccion} correctamente.`
    );
    setDecision(null);
    setDetalleAbierto(null);
    setRecarga((valor) => valor + 1);
  };

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#145c42] border-t-transparent" />

          <p className="font-medium text-[#145c42]">
            Cargando solicitudes...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      <Header
        usuario={usuario}
        titulo="Solicitudes"
      />

      <Sidebar
        usuario={usuario}
        activo="solicitudes"
      />

      <section
        className="
          min-h-screen
          pt-[120px]
          pl-[270px]
          pr-10
          pb-12
        "
      >
        <div className="mx-auto max-w-7xl">

          {/* ENCABEZADO */}
          <div className="mb-8">
            <p className="mb-1 text-sm font-medium text-[#65907e]">
              Gestión de solicitudes
            </p>

            <h1 className="text-3xl font-semibold text-[#173d30]">
              Solicitudes de materiales
            </h1>

            <p className="mt-2 text-gray-500">
              Revise, apruebe o rechace las solicitudes de las bodegas
            </p>
          </div>

          {/* MENSAJE DE ÉXITO */}
          {mensaje && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              {mensaje}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* CONTENEDOR */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

            {/* FILTRO POR ESTADO */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-6">

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[#173d30]">
                  Estado
                </label>

                <select
                  value={filtroEstado}
                  onChange={(event) => {
                    setMensaje("");
                    setDetalleAbierto(null);
                    setFiltroEstado(event.target.value);
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none transition focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
                >
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="APROBADA">Aprobadas</option>
                  <option value="RECHAZADA">Rechazadas</option>
                  <option value="EN_TRANSITO">En tránsito</option>
                  <option value="COMPLETADA">Completadas</option>
                  <option value="CANCELADA">Canceladas</option>
                </select>
              </div>

              <p className="text-sm text-gray-500">
                {solicitudes.length} solicitud(es)
              </p>

            </div>

            {/* TABLA */}
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[#145c42] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      N.º
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Fecha
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Solicitante
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Bodega solicitante
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Prioridad
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Estado
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {solicitudes.map((solicitud) => (
                    <Fragment key={solicitud.id_solicitud}>

                      <tr className="border-b border-gray-100 transition hover:bg-[#f7f8f3]">

                        <td className="px-6 py-4 font-semibold text-[#145c42]">
                          #{solicitud.id_solicitud}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatearFecha(solicitud.fecha_solicitud)}
                        </td>

                        <td className="px-6 py-4 text-gray-800">
                          {solicitud.solicitante}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {solicitud.bodega_origen}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              COLOR_PRIORIDAD[solicitud.prioridad] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {solicitud.prioridad}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              COLOR_ESTADO[solicitud.estado] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {solicitud.estado}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">

                            {/* VER DETALLE: disponible para todos */}
                            <button
                              type="button"
                              onClick={() =>
                                setDetalleAbierto(
                                  detalleAbierto === solicitud.id_solicitud
                                    ? null
                                    : solicitud.id_solicitud
                                )
                              }
                              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                            >
                              {detalleAbierto === solicitud.id_solicitud
                                ? "Ocultar"
                                : "Ver detalle"}
                            </button>

                            {/* APROBAR / RECHAZAR: solo el rol con permiso
                                y solo si la solicitud sigue pendiente */}
                            {solicitud.estado === "PENDIENTE" && (
                              <>
                                <Guard permiso="aprobar_solicitud">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDecision({
                                        solicitud,
                                        accion: "aprobar",
                                      })
                                    }
                                    className="cursor-pointer rounded-lg bg-[#145c42] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f4934]"
                                  >
                                    Aprobar
                                  </button>
                                </Guard>

                                <Guard permiso="rechazar_solicitud">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDecision({
                                        solicitud,
                                        accion: "rechazar",
                                      })
                                    }
                                    className="cursor-pointer rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                  >
                                    Rechazar
                                  </button>
                                </Guard>
                              </>
                            )}

                          </div>
                        </td>

                      </tr>

                      {/* DETALLE DESPLEGABLE */}
                      {detalleAbierto === solicitud.id_solicitud && (
                        <tr className="border-b border-gray-100 bg-[#f7f8f3]">
                          <td colSpan={7} className="px-6 py-5">

                            <div className="mb-4 flex flex-wrap gap-8 text-sm">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-gray-400">
                                  Bodega destino
                                </p>

                                <p className="mt-1 font-semibold text-[#173d30]">
                                  {solicitud.bodega_destino}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-wider text-gray-400">
                                  Total de ítems
                                </p>

                                <p className="mt-1 font-semibold text-[#173d30]">
                                  {solicitud.materiales.length}
                                </p>
                              </div>
                            </div>

                            <table className="w-full overflow-hidden rounded-xl bg-white text-sm">
                              <thead className="bg-[#dcefd7] text-[#145c42]">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold">
                                    Material
                                  </th>

                                  <th className="px-4 py-3 text-left font-semibold">
                                    Tipo
                                  </th>

                                  <th className="px-4 py-3 text-left font-semibold">
                                    Cantidad
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {solicitud.materiales.map((material) => (
                                  <tr
                                    key={material.id_material}
                                    className="border-t border-gray-100"
                                  >
                                    <td className="px-4 py-3 text-gray-800">
                                      {material.nombre}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                      {material.tipo}
                                    </td>

                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                      {material.cantidad}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                          </td>
                        </tr>
                      )}

                    </Fragment>
                  ))}

                </tbody>

              </table>

              {solicitudes.length === 0 && !error && (
                <div className="p-10 text-center text-gray-500">
                  No hay solicitudes para mostrar.
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* VENTANA DE APROBAR / RECHAZAR */}
      {decision && (
        <ModalDecisionSolicitud
          solicitud={decision.solicitud}
          accion={decision.accion}
          onCerrar={() => setDecision(null)}
          onConfirmada={decisionConfirmada}
        />
      )}

    </main>
  );
}