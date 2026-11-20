"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { obtenerSolicitudes } from "@/services/solicitudService";

export default function ListaTransferencias() {
  const router = useRouter();

  const [usuario, setUsuario] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const usuarioGuardado = sessionStorage.getItem("usuario");

        if (!token || !usuarioGuardado) {
          router.push("/");
          return;
        }

        const usuarioActual = JSON.parse(usuarioGuardado);

        if (usuarioActual.rol !== "Jefe de Bodega") {
          router.push("/dashboard");
          return;
        }

        setUsuario(usuarioActual);
        const data = await obtenerSolicitudes("APROBADA", token);
        setSolicitudes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [router]);

  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const texto = busqueda.toLowerCase();
    return (
      sol.id_solicitud.toString().includes(texto) ||
      sol.bodega_origen.toLowerCase().includes(texto) ||
      sol.bodega_destino.toLowerCase().includes(texto)
    );
  });

  if (cargando) return <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]"><p className="text-[#145c42]">Cargando...</p></main>;

  return (
    <main className="min-h-screen bg-[#f7f8f3]">
      <Header usuario={usuario} titulo="Transferencia de Materiales" />
      <Sidebar usuario={usuario} activo="transferencias" />

      <section className="min-h-screen pt-[120px] pl-[270px] pr-10 pb-12">
        <div className="mx-auto max-w-7xl">
          
          <div className="mb-6">
            <p className="text-sm text-[#65907e] font-medium mb-1">En los últimos 30 días</p>
          </div>

          {/* Tarjetas de resumen con los colores exactos del Figma */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#eaf3e6] p-5 rounded-xl border border-[#c9dfc4] shadow-sm">
              <p className="text-sm text-[#39715c] font-medium">Solicitudes aprobadas</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-xl font-bold">+</span>
                <p className="text-3xl font-light text-[#173d30]">{solicitudes.length}</p>
              </div>
            </div>
            <div className="bg-[#eaf3e6] p-5 rounded-xl border border-[#c9dfc4] shadow-sm">
              <p className="text-sm text-[#39715c] font-medium">Transferencias en tránsito</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-xl font-bold">+</span>
                <p className="text-3xl font-light text-[#173d30]">0</p>
              </div>
            </div>
            <div className="bg-[#eaf3e6] p-5 rounded-xl border border-[#c9dfc4] shadow-sm">
              <p className="text-sm text-[#39715c] font-medium">Transferencias completadas</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-xl font-bold">+</span>
                <p className="text-3xl font-light text-[#173d30]">0</p>
              </div>
            </div>
            <div className="bg-[#eaf3e6] p-5 rounded-xl border border-[#c9dfc4] shadow-sm">
              <p className="text-sm text-[#39715c] font-medium">Pendientes de envío</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-xl font-bold">+</span>
                <p className="text-3xl font-light text-[#173d30]">0</p>
              </div>
            </div>
          </div>

          {/* Buscador y botón Filtrar */}
          <div className="mb-6 flex gap-3">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Buscar pedido por ID, bodega, fecha..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#65907e] text-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Filtrar
            </button>
          </div>

          {/* Tabla exacta del Figma */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0b513b] text-white">
                  <th className="px-6 py-4 font-normal">Solicitud ⇅</th>
                  <th className="px-6 py-4 font-normal">Fecha</th>
                  <th className="px-6 py-4 font-normal">Origen</th>
                  <th className="px-6 py-4 font-normal">Destino</th>
                  <th className="px-6 py-4 font-normal">Estado</th>
                  <th className="px-6 py-4 font-normal text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((sol) => (
                  <tr key={sol.id_solicitud} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">SOL-{sol.id_solicitud.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(sol.fecha_solicitud).toLocaleDateString('es-ES', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-gray-800">{sol.bodega_origen}</td>
                    <td className="px-6 py-4 text-gray-800">{sol.bodega_destino}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-[#eaf3e6] text-[#145c42] text-xs font-semibold">
                        {sol.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => router.push(`/transferencias/${sol.id_solicitud}`)}
                        className="flex items-center justify-center gap-2 mx-auto px-4 py-1.5 border border-[#145c42] text-[#145c42] rounded-full text-xs font-semibold hover:bg-[#eaf3e6] transition"
                      >
                        Transferir
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Paginación visual (igual al Figma) */}
            <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
              <button className="text-gray-400 hover:text-gray-600">&lt;</button>
              <button className="w-8 h-8 rounded-full bg-[#145c42] text-white text-sm">1</button>
              <button className="w-8 h-8 rounded-full text-gray-600 text-sm hover:bg-gray-100">2</button>
              <button className="w-8 h-8 rounded-full text-gray-600 text-sm hover:bg-gray-100">3</button>
              <span className="text-gray-400">...</span>
              <button className="text-gray-400 hover:text-gray-600">&gt;</button>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}