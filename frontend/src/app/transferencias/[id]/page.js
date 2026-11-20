"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Guard from "@/components/Guard";

import { obtenerSolicitudes } from "@/services/solicitudService";
import { consultarExistenciasTransferencia } from "@/services/transferenciaService";


export default function PaginaConfirmarTransferencia() {
  return (
    <Guard permiso="transferir_material" fallback={<main className="p-10">No tiene permiso.</main>}>
      <ContenidoConfirmacion />
    </Guard>
  );
}

function ContenidoConfirmacion() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [usuario, setUsuario] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const token = sessionStorage.getItem("token");
        const usuarioActual = JSON.parse(sessionStorage.getItem("usuario") || "null");
        const contexto = JSON.parse(sessionStorage.getItem("contexto") || "null");

        if (!token || !usuarioActual) return router.replace("/");
        if (!Number.isSafeInteger(contexto?.id_bodega)) return router.replace("/contexto");

        setUsuario(usuarioActual);

        const solicitudes = await obtenerSolicitudes("APROBADA", token);
        const solicitud = solicitudes.find((item) => Number(item.id_solicitud) === Number(id));

        if (!solicitud) throw new Error("La solicitud no está aprobada o no existe.");

        const idBodegaSalida = solicitud.id_bodega_destino;
        const idBodegaRecepcion = solicitud.id_bodega_origen;

        if (contexto.id_bodega !== idBodegaSalida) {
          throw new Error("Seleccione la bodega central como contexto para ver esta transferencia.");
        }

        const existencias = await consultarExistenciasTransferencia({
          solicitud, idBodegaSalida, idBodegaRecepcion, token,
        });

        setDatos({ solicitud, ...existencias });
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id, router]);

  if (cargando) return <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]"><p className="text-[#145c42]">Cargando...</p></main>;
  if (error) return <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]"><p className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</p></main>;

  return (
    <main className="min-h-screen bg-[#f7f8f3]">
      <Header usuario={usuario} titulo="Detalle de transferencia" />
      <Sidebar usuario={usuario} activo="transferencias" />

      <section className="min-h-screen pb-12 pl-[270px] pr-10 pt-[120px]">
        <div className="mx-auto max-w-4xl">
          
          <div className="mb-6">
            <p className="text-sm text-[#65907e] font-medium mb-1">RF-09: Transferir material entre bodegas</p>
            <h1 className="text-2xl font-semibold text-[#173d30]">Detalle de transferencia</h1>
          </div>

          {/* Tarjeta gris de Info General (Como en el Figma) */}
          <div className="bg-[#eaf3e6] border border-[#c9dfc4] rounded-xl p-6 mb-8 flex justify-between items-center text-sm text-[#173d30]">
            <div className="space-y-2">
              <p><span className="font-medium text-gray-500">Solicitud:</span> <strong className="font-semibold">SOL-{datos.solicitud.id_solicitud.toString().padStart(3, '0')}</strong></p>
              <p><span className="font-medium text-gray-500">Origen:</span> <strong className="font-semibold">{datos.bodegaOrigen}</strong></p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium text-gray-500">Destino:</span> <strong className="font-semibold">{datos.bodegaDestino}</strong></p>
              <p><span className="font-medium text-gray-500">Estado:</span> <strong className="font-semibold text-[#145c42]">{datos.solicitud.estado}</strong></p>
            </div>
          </div>

          {/* Tabla de materiales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#0b513b] text-white">
                  <th className="px-6 py-4 font-normal w-12"></th>
                  <th className="px-6 py-4 font-normal">Código ⇅</th>
                  <th className="px-6 py-4 font-normal">Material</th>
                  <th className="px-6 py-4 font-normal text-center">Cantidad Solicitada</th>
                  <th className="px-6 py-4 font-normal text-center">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {datos.materiales.map((mat, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="w-4 h-4 text-[#145c42] rounded border-gray-300 focus:ring-[#145c42]" defaultChecked />
                    </td>
                    <td className="px-6 py-4 text-gray-700">{mat.codigo}</td>
                    <td className="px-6 py-4 text-gray-700">{mat.nombre}</td>
                    <td className="px-6 py-4 text-gray-700 text-center">{mat.cantidad}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mat.cantidad <= mat.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {mat.stock_actual || 30}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-sm text-[#145c42] mb-8 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Inventario suficiente para realizar la transferencia.
          </p>

          {/* Botones */}
          <div className="flex justify-center gap-4">
            <button className="px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition">
              Rechazar
            </button>
            <button className="px-8 py-3 rounded-lg bg-[#145c42] hover:bg-[#0f4934] text-white font-semibold text-sm transition">
              Confirmar
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}