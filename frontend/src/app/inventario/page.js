"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ModalRegistrarEntrada from "@/components/ModalRegistrarEntrada";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerInventario } from "@/services/inventarioService";

export default function Inventario() {
  const router = useRouter();
  
const [usuario, setUsuario] = useState(null);
  const [modalEntradaAbierto, setModalEntradaAbierto] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [bodega, setBodega] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarInventario = async () => {
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

        const contexto = JSON.parse(contextoGuardado);

        if (!contexto.id_bodega) {
          setError("El contexto seleccionado no corresponde a una bodega.");
          return;
        }
      

        const datos = await obtenerInventario(
          contexto.id_bodega,
          token
        );

        setInventario(datos.materiales || []);
        setBodega(datos.bodega || contexto.nombre);
      } catch (error) {
        console.error("Error al cargar inventario:", error);
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarInventario();
  }, [router]);

  const materialesFiltrados = inventario.filter((material) => {
    const texto = busqueda.toLowerCase();

    return (
      material.codigo.toLowerCase().includes(texto) ||
      material.nombre.toLowerCase().includes(texto) ||
      material.tipo.toLowerCase().includes(texto)
    );
  });

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#145c42] border-t-transparent" />

          <p className="font-medium text-[#145c42]">
            Cargando materiales...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

    <Header
      usuario={usuario}
      titulo="Materiales"
    />

    <Sidebar
      usuario={usuario}
      activo="materiales"
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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="mb-1 text-sm font-medium text-[#65907e]">
              Gestión de inventario
            </p>

            <h1 className="text-3xl font-semibold text-[#173d30]">
              Materiales
            </h1>

            <p className="mt-2 text-gray-500">
              Inventario disponible en {bodega}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalEntradaAbierto(true)}
            className="cursor-pointer rounded-xl bg-[#145c42] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0f4934]"
          >
            + Registrar entrada
          </button>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* CONTENEDOR */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          {/* BUSCADOR */}
          <div className="border-b border-gray-100 p-6">
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por código, material o tipo..."
              className="w-full max-w-md rounded-xl border border-gray-300 px-4 py-3 text-[#173d30] outline-none transition focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
            />
          </div>

          {/* TABLA */}
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-[#145c42] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Código
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Material
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Cantidad
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Unidad
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>

                {materialesFiltrados.map((material) => (
                  <tr
                    key={material.id_material}
                    className="border-b border-gray-100 transition hover:bg-[#f7f8f3]"
                  >
                    <td className="px-6 py-4 font-semibold text-[#145c42]">
                      {material.codigo}
                    </td>

                    <td className="px-6 py-4 text-gray-800">
                      {material.nombre}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {material.tipo}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {material.cantidad}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {material.unidad_medida}
                    </td>

                    <td className="px-6 py-4">

                      {material.stock_bajo ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Disponible
                        </span>
                      )}

                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

            {materialesFiltrados.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                No se encontraron materiales.
              </div>
            )}

          </div>

        </div>

      </div>

    </section>
<ModalRegistrarEntrada
  abierto={modalEntradaAbierto}
  onCerrar={() => setModalEntradaAbierto(false)}
  onEntradaRegistrada={async (resultado) => {
    setInventario((inventarioActual) =>
      inventarioActual.map((material) =>
        material.id_material === resultado.id_material
          ? {
              ...material,
              cantidad: resultado.cantidad_actual,
            }
          : material
      )
    );
  }}
/>

  </main>
);
}