"use client";

import { useRouter } from "next/navigation";
import Guard from "@/components/Guard";
import { useState } from "react";
import ModalCerrarSesion from "@/components/ModalCerrarSesion";

export default function Sidebar({ usuario, activo = "" }) {
  const router = useRouter();
  const [modalCerrarAbierto, setModalCerrarAbierto] = useState(false);

  const opcionClase = (nombre) =>
    `mx-3 mb-2 px-5 py-3 rounded-xl flex items-center gap-3
     text-sm transition cursor-pointer
     ${activo === nombre
      ? "bg-[#209b70] text-white font-semibold"
      : "text-white/85 hover:bg-white/10"
    }`;

  return (
    <aside
      className="
        fixed top-[82px] left-0 bottom-0
        w-[230px]
        bg-[#10583f]
        text-white
        z-20
        rounded-tr-[28px]
        shadow-xl
        flex flex-col
      "
    >
      {/* USUARIO */}
      <div
        onClick={() => router.push("/contexto")}
        className="
    px-6 pt-8 pb-7
    border-b border-white/10
    cursor-pointer
    transition
    hover:bg-white/10
  "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              w-11 h-11
              bg-[#dcefd7]
              text-[#145c42]
              rounded-full
              flex items-center justify-center
              font-bold text-lg
            "
          >
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-sm">
              {usuario?.nombre}
            </p>

            <p className="text-xs text-white/65 mt-1">
              {usuario?.rol}
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="min-h-0 flex-1 overflow-y-auto py-6">

        <div
          onClick={() => router.push("/dashboard")}
          className={opcionClase("dashboard")}
        >
          <span className="text-lg">⌂</span>
          Dashboard
        </div>

        <Guard permiso="ver_inventario">
          <div
            onClick={() => router.push("/inventario")}
            className={opcionClase("materiales")}
          >
            <span>▦</span>
            Materiales
          </div>
        </Guard>

        <Guard permiso="emitir_vale">
          <div
            onClick={() => router.push("/salida")}
            className={opcionClase("salida")}
          >
            <span>▤</span>
            Emitir Vale
          </div>
        </Guard>

        <Guard permiso="ver_trazabilidad">
          <div className={opcionClase("trazabilidad")}>
            <span>▤</span>
            Trazabilidad
          </div>
        </Guard>

        <Guard permiso="generar_reporte">
          <div className={opcionClase("reportes")}>
            <span>◉</span>
            Reportes
          </div>
        </Guard>

        <Guard permiso="transferir_material">
          <div className={opcionClase("transferencias")}>
            <span>⇄</span>
            Transferencias
          </div>
        </Guard>

        <Guard permiso="solicitar_material">
  <div
    onClick={() => router.push("/solicitudes")}
    className={opcionClase("solicitudes")}
  >
    <span>▥</span>
    Pedidos
  </div>
</Guard>

        {/* gestion de solicitudes*/}
        <Guard permiso="aprobar_solicitud">
          <div
            onClick={() => router.push("/solicitudes")}
            className={opcionClase("solicitudes")}
          >
            <span>▧</span>
            Solicitudes
          </div>
        </Guard>
        
        <div className="mx-6 my-5 border-t border-white/15" />

        <Guard permiso="gestionar_usuario">
          <div className={opcionClase("configuracion")}>
            <span>⚙</span>
            Configuración
          </div>
        </Guard>

      </nav>

            {/* CERRAR SESIÓN */}
      <div className="shrink-0 p-5">
        <button
          type="button"
          onClick={() => setModalCerrarAbierto(true)}
          className="
            w-full
            flex items-center justify-center gap-2
            rounded-xl bg-red-600 py-3
            text-sm font-semibold text-white
            shadow-lg transition
            hover:bg-red-700 cursor-pointer
            focus-visible:outline-2
            focus-visible:outline-offset-4
            focus-visible:outline-white
          "
        >
          Cerrar sesión
        </button>
      </div>

      <ModalCerrarSesion
        abierto={modalCerrarAbierto}
        onCerrar={() => setModalCerrarAbierto(false)}
      />
    </aside>
  );
}