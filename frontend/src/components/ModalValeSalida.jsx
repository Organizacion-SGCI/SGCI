"use client";

import { useRouter } from "next/navigation";

export default function ModalValeSalida({
  abierto,
  vale,
  onCerrar,
  onEmitirOtro,
}) {
  const router = useRouter();

  if (!abierto || !vale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* CABECERA VERDE */}
        <div className="bg-[#145c42] px-7 py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#145c42]">
            ✓
          </div>

          <h2 className="text-xl font-semibold text-white">
            Vale Registrado
          </h2>

          <p className="mt-1 text-sm text-white/70">
            La salida de materiales fue registrada correctamente
          </p>
        </div>

        {/* CUERPO */}
        <div className="p-7">

          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Detalle del vale
          </p>

          <div className="space-y-4 rounded-xl bg-[#f7f8f3] p-5">

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Código de material</span>
              <span className="font-semibold text-[#173d30]">
                {vale.codigo_material} - {vale.material}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Cantidad emitida</span>
              <span className="font-semibold text-[#173d30]">
                {vale.cantidad} {vale.unidad_medida}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Proyecto</span>
              <span className="font-semibold text-[#173d30]">
                {vale.proyecto}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Responsable</span>
              <span className="font-semibold text-[#173d30]">
                {vale.responsable}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Tipo de movimiento</span>
              <span className="font-semibold text-[#145c42]">
                Salida
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
              <span className="text-gray-500">Stock actual del material</span>
              <span className="font-semibold text-[#145c42]">
                {vale.cantidad_actual} {vale.unidad_medida}
              </span>
            </div>

          </div>

          {/* BOTONES */}
          <div className="mt-6 flex gap-3">

            <button
              type="button"
              onClick={() => {
                onCerrar();
                router.push("/trazabilidad");
              }}
              className="w-full cursor-pointer rounded-xl border border-[#145c42] px-4 py-3 text-sm font-semibold text-[#145c42] transition hover:bg-[#dcefd7]"
            >
              Ver Trazabilidad
            </button>

            <button
              type="button"
              onClick={onEmitirOtro}
              className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Emitir otro Vale
            </button>

            <button
              type="button"
              onClick={onCerrar}
              className="w-full cursor-pointer rounded-xl bg-[#145c42] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f4934]"
            >
              Aceptar
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}