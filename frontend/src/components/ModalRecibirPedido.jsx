"use client";

import { useState } from "react";
import { confirmarRecepcion } from "@/services/solicitudService";

export default function ModalRecibirPedido({ abierto, solicitud, onCerrar, onExito }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  if (!abierto || !solicitud) return null;

  const manejarRecepcion = async () => {
    try {
      setCargando(true);
      setError("");
      const token = sessionStorage.getItem("token");
      
      await confirmarRecepcion(solicitud.id_solicitud, token);
      
      if (onExito) onExito(); // Recarga la tabla
      onCerrar(); // Cierra el modal
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        
        {/* Cabecera */}
        <div className="bg-[#145c42] px-7 py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#145c42]">
            
          </div>
          <h2 className="text-xl font-semibold text-white">Confirmar Recepción</h2>
          <p className="mt-1 text-sm text-white/70">Solicitud #{solicitud.id_solicitud}</p>
        </div>

        {/* Cuerpo */}
        <div className="p-7 text-center">
          <p className="mb-6 text-sm text-gray-600">
            ¿Confirmas que has recibido todos los materiales de esta transferencia en tu bodega satélite?
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              disabled={cargando}
              className="w-full rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={manejarRecepcion}
              disabled={cargando}
              className="w-full rounded-xl bg-[#145c42] py-3 text-sm font-semibold text-white hover:bg-[#0f4934] transition disabled:opacity-50"
            >
              {cargando ? "Recibiendo..." : "Sí, recibido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}