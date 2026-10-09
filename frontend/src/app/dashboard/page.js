"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Guard from "@/components/Guard";

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [contexto, setContexto] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem("usuario");
    const contextoGuardado = sessionStorage.getItem("contexto");

    if (!usuarioGuardado) {
      router.push("/");
      return;
    }

    if (!contextoGuardado) {
      router.push("/contexto");
      return;
    }

    setUsuario(JSON.parse(usuarioGuardado));
    setContexto(JSON.parse(contextoGuardado));
  }, [router]);

  if (!usuario || !contexto) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#145c42] border-t-transparent rounded-full animate-spin" />

          <p className="text-[#145c42] font-medium">
            Cargando...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">

      {/* ====================================================== */}
      {/* ENCABEZADO SUPERIOR */}
      {/* ====================================================== */}
      <header
        className="
          fixed top-0 left-0 right-0
          h-[82px]
          bg-[#dcefd7]
          border-b border-[#c9dfc4]
          z-30
          flex items-center
          justify-between
          px-6
        "
      >
     {/* LOGO - REGRESAR AL INICIO */}
<div
  onClick={() => router.push("/")}
  className="flex items-center gap-3 cursor-pointer"
>
  <img
    src="/images/logo-parque-tempisque.png"
    alt="Parque Tempisque"
    className="h-12 w-auto object-contain"
  />

  <span className="hidden sm:block text-[#145c42] text-xl font-semibold">
    Parque Tempisque
  </span>
</div>

        {/* TÍTULO */}
        <h1
          className="
            absolute left-1/2 -translate-x-1/2
            text-[#124c38]
            font-semibold
            text-xl
          "
        >
          Dashboard
        </h1>

        {/* USUARIO ARRIBA */}
        
        {/* USUARIO ARRIBA */}
<div
  onClick={() => router.push("/contexto")}
  className="
    text-right hidden md:block
    cursor-pointer
    rounded-lg
    px-3 py-2
    transition
    hover:bg-[#c9dfc4]
  "
  title="Cambiar contexto"
>
  <p className="text-[#124c38] font-semibold">
    {usuario.nombre}
  </p>

  <p className="text-sm text-[#39715c]">
    {usuario.rol}
  </p>
</div>
</header>

      {/* ====================================================== */}
      {/* BARRA LATERAL */}
      {/* ====================================================== */}
      <aside
        className="
          fixed
          top-[82px]
          left-0
          bottom-0
          w-[230px]
          bg-[#10583f]
          text-white
          z-20
          rounded-tr-[28px]
          shadow-xl
          flex
          flex-col
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
  title="Cambiar contexto"
>

          <div className="flex items-center gap-3">

            {/* ICONO USUARIO */}
            <div
              className="
                w-11 h-11
                bg-[#dcefd7]
                text-[#145c42]
                rounded-full
                flex items-center
                justify-center
                font-bold
                text-lg
              "
            >
              {usuario.nombre?.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold text-sm">
                {usuario.nombre}
              </p>

              <p className="text-xs text-white/65 mt-1">
                {usuario.rol}
              </p>
            </div>

          </div>
        </div>


        {/* NAVEGACIÓN */}
        <nav className="flex-1 py-6">

          {/* DASHBOARD - visible para todos los roles */}
          <div
            className="
      mx-3
      mb-2
      px-5
      py-3
      bg-[#209b70]
      rounded-xl
      flex
      items-center
      gap-3
      font-semibold
      text-sm
    "
          >
            <span className="text-lg">⌂</span>
            Dashboard
          </div>

          {/* MATERIALES - visible con permiso ver_inventario */}
<Guard permiso="ver_inventario">
  <div
    onClick={() => router.push("/inventario")}
    className="mx-3 px-5 py-3 rounded-xl flex items-center gap-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer"
  >
    <span>▦</span>
    Materiales
  </div>
</Guard>

          {/* TRAZABILIDAD - visible con permiso ver_trazabilidad */}
          <Guard permiso="ver_trazabilidad">
            <div className="mx-3 px-5 py-3 rounded-xl flex items-center gap-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
              <span>▤</span>
              Trazabilidad
            </div>
          </Guard>

          {/* REPORTES - visible con permiso generar_reporte */}
          <Guard permiso="generar_reporte">
            <div className="mx-3 px-5 py-3 rounded-xl flex items-center gap-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
              <span>◉</span>
              Reportes
            </div>
          </Guard>

          {/* TRANSFERENCIAS - solo visible para Jefe de Bodega */}
          <Guard permiso="transferir_material">
            <div className="mx-3 px-5 py-3 rounded-xl flex items-center gap-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
              <span>⇄</span>
              Transferencias
            </div>
          </Guard>

          {/* PEDIDOS - solo visible para Encargado */}
          <Guard permiso="solicitar_material">
            <div className="mx-3 px-5 py-3 rounded-xl flex items-center gap-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
              <span>▥</span>
              Pedidos
            </div>
          </Guard>

          <div className="mx-6 my-5 border-t border-white/15" />

          {/* CONFIGURACIÓN - solo visible para Administrador */}
          <Guard permiso="gestionar_usuario">
            <div className="mx-3 px-5 py-3 rounded-xl flex items-center gap-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
              <span>⚙</span>
              Configuración
            </div>
          </Guard>

        </nav>


        {/* CERRAR SESIÓN - SOLO VISUAL POR AHORA */}
        <div className="p-5">
          <div
            className="
              w-full
              border border-white/40
              rounded-xl
              py-3
              text-center
              text-sm
              hover:bg-white/10
              transition
            "
          >
            Cerrar sesión
          </div>
        </div>

      </aside>

      {/* ====================================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ====================================================== */}
      <section
        className="
          pt-[120px]
          pl-[270px]
          pr-10
          pb-12
          min-h-screen
        "
      >

        <div className="max-w-6xl mx-auto">

          {/* BIENVENIDA */}
          <div className="mb-9">
            <p className="text-sm text-[#65907e] font-medium mb-1">
              Sistema de Gestión y Control de Inventario
            </p>

            <h2 className="text-3xl font-semibold text-[#173d30]">
              Bienvenido, {usuario.nombre}
            </h2>

            <p className="text-gray-500 mt-2">
              Este es el resumen de tu sesión actual.
            </p>
          </div>

          {/* ================================================== */}
          {/* TARJETAS SUPERIORES */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* USUARIO */}
            <div
              className="
                bg-white
                rounded-2xl
                border border-gray-100
                shadow-sm
                p-7
              "
            >
              <div className="flex items-center justify-between mb-6">

                <div>
                  <p className="text-sm text-gray-400">
                    Usuario actual
                  </p>

                  <h3 className="text-xl font-semibold text-[#173d30] mt-1">
                    {usuario.nombre}
                  </h3>
                </div>

                <div
                  className="
                    w-12 h-12
                    rounded-xl
                    bg-[#e1f2dc]
                    flex items-center
                    justify-center
                    text-[#145c42]
                    text-xl
                    font-bold
                  "
                >
                  {usuario.nombre?.charAt(0).toUpperCase()}
                </div>

              </div>

              <div className="border-t border-gray-100 pt-4">

                <p className="text-sm text-gray-500">
                  Rol
                </p>

                <p className="text-[#145c42] font-semibold mt-1">
                  {usuario.rol}
                </p>

              </div>
            </div>

            {/* CONTEXTO */}
            <div
              className="
                bg-white
                rounded-2xl
                border border-gray-100
                shadow-sm
                p-7
              "
            >

              <div className="flex items-center justify-between mb-6">

                <div>
                  <p className="text-sm text-gray-400">
                    Contexto actual
                  </p>

                  <h3 className="text-xl font-semibold text-[#173d30] mt-1">
                    {contexto.nombre}
                  </h3>
                </div>

                <div
                  className="
                    px-4 py-2
                    bg-[#e1f2dc]
                    text-[#145c42]
                    rounded-full
                    text-xs
                    font-bold
                    tracking-wide
                  "
                >
                  {contexto.tipo_contexto}
                </div>

              </div>

              <div className="border-t border-gray-100 pt-4">

                <p className="text-sm text-gray-500">
                  Ubicación
                </p>

                <p className="text-[#145c42] font-semibold mt-1">
                  {contexto.ubicacion}
                </p>

              </div>

            </div>

          </div>

          {/* ================================================== */}
          {/* INFORMACIÓN DEL CONTEXTO */}
          {/* ================================================== */}

          <div
            className="
              bg-white
              rounded-2xl
              border border-gray-100
              shadow-sm
              overflow-hidden
            "
          >

            {/* CABECERA VERDE */}
            <div className="bg-[#145c42] px-8 py-5">

              <h3 className="text-white text-lg font-semibold">
                Información del contexto
              </h3>

              <p className="text-white/60 text-sm mt-1">
                Contexto seleccionado para esta sesión
              </p>

            </div>

            {/* INFORMACIÓN */}
            <div
              className="
                p-8
                grid
                grid-cols-1
                md:grid-cols-2
                lg:grid-cols-4
                gap-8
              "
            >

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Tipo
                </p>

                <p className="text-gray-800 font-semibold mt-2">
                  {contexto.tipo_contexto}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Nombre
                </p>

                <p className="text-gray-800 font-semibold mt-2">
                  {contexto.nombre}
                </p>
              </div>

              {contexto.codigo && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Código
                  </p>

                  <p className="text-gray-800 font-semibold mt-2">
                    {contexto.codigo}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Ubicación
                </p>

                <p className="text-gray-800 font-semibold mt-2">
                  {contexto.ubicacion} 
                </p>
              </div>

            </div>
            {/* ================================================== */}
            {/* ACCIONES SEGÚN ROL */}
            {/* ================================================== */}

            <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-7">

              <h3 className="text-lg font-semibold text-[#173d30] mb-5">
                Acciones disponibles
              </h3>

              <div className="flex flex-wrap gap-3">

                {/* APROBAR SOLICITUD - solo Jefe de Bodega */}
                <Guard permiso="aprobar_solicitud">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer">
                    Aprobar solicitud
                  </button>
                </Guard>

                {/* SOLICITAR MATERIAL - solo Encargado */}
                <Guard permiso="solicitar_material">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer">
                    Solicitar material
                  </button>
                </Guard>

                {/* EMITIR VALE - solo Jefa de Construcción */}
                <Guard permiso="emitir_vale">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer">
                    Emitir vale
                  </button>
                </Guard>

                {/* GESTIONAR USUARIOS - solo Administrador */}
                <Guard permiso="gestionar_usuario">
                  <button className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer">
                    Gestionar usuarios
                  </button>
                </Guard>

              </div>

            </div>
            
          </div>

        </div>

      </section>

    </main>
  );
}