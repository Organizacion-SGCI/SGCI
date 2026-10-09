"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerComprobanteIngreso } from "@/services/comprobanteService";

// H-08.2: pantalla del comprobante de ingreso.
export default function ComprobanteIngreso() {
  const router = useRouter();

  // El id viene de la URL: /inventario/comprobante/7 
  const { id } = useParams();

  const [usuario, setUsuario] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarComprobante = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const usuarioGuardado = sessionStorage.getItem("usuario");

        if (usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }

        if (!token) {
          router.push("/");
          return;
        }

        const datos = await obtenerComprobanteIngreso(id, token);

        setComprobante(datos);
      } catch (error) {
        console.error("Error al cargar comprobante:", error);
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarComprobante();
  }, [id, router]);

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#145c42] border-t-transparent" />

          <p className="font-medium text-[#145c42]">
            Cargando comprobante...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      <Header
        usuario={usuario}
        titulo="Comprobante de ingreso"
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
        <div className="mx-auto max-w-5xl">

          {/* ENCABEZADO */}
          <div className="mb-8">
            <p className="mb-1 text-sm font-medium text-[#65907e]">
              Gestión de inventario
            </p>

            <h1 className="text-3xl font-semibold text-[#173d30]">
              Comprobante de ingreso
            </h1>

            <p className="mt-2 text-gray-500">
              Registro generado al confirmar la entrada de materiales
            </p>
          </div>

          {/* ERROR (por ejemplo: el registro no existe) */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* COMPROBANTE */}
          {comprobante && (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

              {/* CABECERA VERDE CON EL IDENTIFICADOR ÚNICO */}
              <div className="flex items-center justify-between bg-[#145c42] px-8 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Comprobante de ingreso
                  </h2>

                  <p className="mt-1 text-sm text-white/70">
                    Identificador único
                  </p>
                </div>

                <span className="rounded-full bg-[#dcefd7] px-4 py-2 text-sm font-bold text-[#145c42]">
                  #{comprobante.id_movimiento}
                </span>
              </div>

              {/* FECHA, PROVEEDOR Y RESPONSABLE */}
              <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Fecha
                  </p>

                  <p className="mt-2 font-semibold text-[#173d30]">
                    {new Date(comprobante.fecha_movimiento).toLocaleString(
                      "es-CR",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Proveedor
                  </p>

                  <p className="mt-2 font-semibold text-[#173d30]">
                    {comprobante.proveedor.nombre}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Responsable
                  </p>

                  <p className="mt-2 font-semibold text-[#173d30]">
                    {comprobante.responsable.nombre}
                  </p>
                </div>

              </div>

              {/* MATERIALES INGRESADOS */}
              <div className="border-t border-gray-100">

                <div className="px-8 pt-6 pb-4">
                  <h3 className="text-lg font-semibold text-[#173d30]">
                    Materiales ingresados
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">

                    <thead className="bg-[#145c42] text-white">
                      <tr>
                        <th className="px-8 py-4 text-left text-sm font-semibold">
                          Código
                        </th>

                        <th className="px-8 py-4 text-left text-sm font-semibold">
                          Material
                        </th>

                        <th className="px-8 py-4 text-left text-sm font-semibold">
                          Unidad
                        </th>

                        <th className="px-8 py-4 text-left text-sm font-semibold">
                          Cantidad
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {comprobante.materiales.map((material) => (
                        <tr
                          key={material.id_material}
                          className="border-b border-gray-100 transition hover:bg-[#f7f8f3]"
                        >
                          <td className="px-8 py-4 font-semibold text-[#145c42]">
                            {material.codigo}
                          </td>

                          <td className="px-8 py-4 text-gray-800">
                            {material.nombre}
                          </td>

                          <td className="px-8 py-4 text-gray-600">
                            {material.unidad_medida}
                          </td>

                          <td className="px-8 py-4 font-semibold text-gray-800">
                            {material.cantidad}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>

              </div>

            </div>
          )}

          {/* VOLVER */}
          <button
            type="button"
            onClick={() => router.push("/inventario")}
            className="mt-6 cursor-pointer rounded-xl border border-[#145c42] px-6 py-3 font-semibold text-[#145c42] transition hover:bg-[#dcefd7]"
          >
            ← Volver a materiales
          </button>

        </div>
      </section>

    </main>
  );
}