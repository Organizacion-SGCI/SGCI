"use client";

import { useState } from "react";
import {
  aprobarSolicitud,
  rechazarSolicitud,
} from "@/services/solicitudService";

// H-05.3: ventana para confirmar la decisión sobre una solicitud
//   accion = "aprobar"  -> pide confirmación
//   accion = "rechazar" -> pide ademas el motivo del rechazo
export default function ModalDecisionSolicitud({
  solicitud,
  accion,
  onCerrar,
  onConfirmada,
}) {
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const esRechazo = accion === "rechazar";

  const confirmar = async () => {
    try {
      setError("");

      // El motivo es obligatorio al rechazar
      if (esRechazo && !motivo.trim()) {
        setError("Debe indicar el motivo del rechazo.");
        return;
      }

      setCargando(true);

      const token = sessionStorage.getItem("token");

      const resultado = esRechazo
        ? await rechazarSolicitud(solicitud.id_solicitud, motivo.trim(), token)
        : await aprobarSolicitud(solicitud.id_solicitud, token);

      // Avisa a la pantalla para que cierre la ventana y recargue la lista
      onConfirmada(resultado);
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      {/* VENTANA */}
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* CABECERA */}
        <div className="flex items-center justify-between bg-[#145c42] px-7 py-5">

          <div>
            <h2 className="text-xl font-semibold text-white">
              {esRechazo ? "Rechazar solicitud" : "Aprobar solicitud"}
            </h2>

            <p className="mt-1 text-sm text-white/70">
              Solicitud #{solicitud.id_solicitud}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-2xl text-white transition hover:bg-white/20"
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>

        {/* CONTENIDO */}
        <div className="p-7">

          {/* RESUMEN */}
          <div className="space-y-4 rounded-xl bg-[#f7f8f3] p-5">

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Solicitante</span>

              <span className="font-semibold text-[#173d30]">
                {solicitud.solicitante}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Bodega solicitante</span>

              <span className="font-semibold text-[#173d30]">
                {solicitud.bodega_origen}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Materiales</span>

              <span className="font-semibold text-[#173d30]">
                {solicitud.materiales.length}
              </span>
            </div>

          </div>

          {/* APROBAR: advertencia / RECHAZAR: motivo */}
          {esRechazo ? (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Motivo del rechazo *
              </label>

              <textarea
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                maxLength={150}
                rows={3}
                placeholder="Ej: Material no disponible"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {motivo.length}/150
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-600">
              Esta acción no se puede deshacer. Se notificará al solicitante
              que su solicitud fue aprobada.
            </p>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* BOTONES */}
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">

            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="cursor-pointer rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmar}
              disabled={cargando}
              className={
                esRechazo
                  ? "cursor-pointer rounded-xl bg-red-600 px-7 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  : "cursor-pointer rounded-xl bg-[#145c42] px-7 py-3 font-semibold text-white transition hover:bg-[#0f4934] disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {cargando
                ? "Procesando..."
                : esRechazo
                ? "Confirmar rechazo"
                : "Confirmar aprobación"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}