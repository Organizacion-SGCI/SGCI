"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { obtenerContextos } from "@/services/contextoService";

export default function Contexto() {
  const [usuario, setUsuario] = useState(null);

  const [contextos, setContextos] = useState({
    bodegas: [],
    proyectos: [],
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      const usuarioGuardado = sessionStorage.getItem("usuario");

      if (!usuarioGuardado) {
        setError("No hay una sesión activa.");
        setCargando(false);
        return;
      }

      const usuarioActual = JSON.parse(usuarioGuardado);
      setUsuario(usuarioActual);

      try {
        const datos = await obtenerContextos(usuarioActual.id_usuario);
        setContextos(datos);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

const seleccionarBodega = (bodega) => {
  const contextoSeleccionado = {
    tipo_contexto: "BODEGA",
    ...bodega,
  };

  sessionStorage.setItem(
    "contexto",
    JSON.stringify(contextoSeleccionado)
  );

  router.push("/dashboard");
};

const seleccionarProyecto = (proyecto) => {
  const contextoSeleccionado = {
    tipo_contexto: "PROYECTO",
    ...proyecto,
  };

  sessionStorage.setItem(
    "contexto",
    JSON.stringify(contextoSeleccionado)
  );

  router.push("/dashboard");
};
  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Cargando contextos...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

 return (
  <main
    className="relative min-h-screen bg-cover bg-center overflow-hidden"
    style={{
      backgroundImage: "url('/images/fondo-login.jpg')",
    }}
  >
    {/* Capa oscura sobre la fotografía */}
    <div className="absolute inset-0 bg-black/20" />

    {/* ====================================================== */}
    {/* SIDEBAR */}
    {/* ====================================================== */}
    <aside
      className="
        fixed top-0 left-0 z-30
        h-screen w-[250px]
        bg-gradient-to-b
        from-[#0b513b]/95
        via-[#07513c]/95
        to-[#064632]/95
        backdrop-blur-md
        border-r border-white/10
        shadow-2xl
        flex flex-col
      "
    >
   {/* Logo */}
<div
  onClick={() => router.push("/")}
  className="
    bg-white/85
    backdrop-blur-md
    min-h-[95px]
    px-5
    flex items-center
    rounded-br-[30px]
    cursor-pointer
  "
>
  <img
    src="/images/logo-parque-tempisque.png"
    alt="Parque Tempisque"
    className="h-14 w-auto object-contain"
  />

  <span className="ml-3 text-[#315c49] text-xl font-semibold">
    Parque
    <br />
    Tempisque
  </span>
</div>

      {/* Usuario */}
      <div className="px-7 pt-10 pb-7 border-b border-white/15">
        <div className="flex items-center gap-4">

          {/* Icono usuario */}
          <div
            className="
              w-12 h-12
              bg-white/90
              rounded-full
              flex items-center justify-center
              text-[#0b513b]
              text-2xl
            "
          >
            👤
          </div>

          <div>
            <p className="text-white text-lg font-semibold">
              {usuario?.nombre}
            </p>

            <p className="text-white/65 text-sm mt-1">
              {usuario?.rol}
            </p>
          </div>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 px-5 py-7 space-y-2">

        <div
  onClick={() => router.push("/dashboard")}
  className="
    flex items-center gap-4
    px-4 py-3
    rounded-xl
    text-white/75
    hover:bg-white/10
    hover:text-white
    transition
    cursor-pointer
  "
>
  <span>⌂</span>
  <span>Dashboard</span>
</div>

        <div
  onClick={() => router.push("/inventario")}
  className="
    flex items-center gap-4
    px-4 py-3
    rounded-xl
    text-white/75
    hover:bg-white/10
    hover:text-white
    transition
    cursor-pointer
  "
>
  <span>▣</span>
  <span>Materiales</span>
</div>

        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/75">
          <span>▤</span>
          <span>Trazabilidad</span>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/75">
          <span>◉</span>
          <span>Reportes</span>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/75">
          <span>⇄</span>
          <span>Transferencias</span>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/75">
          <span>📄</span>
          <span>Pedidos</span>
        </div>

        <div className="border-t border-white/15 my-5" />

        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/75">
          <span>⚙</span>
          <span>Configuración</span>
        </div>

      </nav>

      {/* Cerrar sesión - visual por ahora */}
      <div className="p-5">
        <button
          type="button"
          className="
            w-full
            border border-white/50
            text-white
            py-3
            rounded-xl
            hover:bg-white/10
            transition
          "
        >
          ↪ Cerrar sesión
        </button>
      </div>
    </aside>

    {/* ====================================================== */}
    {/* CONTENIDO */}
    {/* ====================================================== */}
    <section
      className="
        relative z-10
        ml-[250px]
        min-h-screen
        flex items-center justify-center
        px-8 py-12
      "
    >

      {/* Panel central */}
      <div
        className="
          relative
          w-full
          max-w-[1050px]
          min-h-[560px]
          bg-gradient-to-br
          from-[#0c392b]/85
          via-[#15513b]/80
          to-[#4c8b46]/75
          backdrop-blur-md
          border border-white/30
          rounded-[36px]
          shadow-2xl
          px-14 py-14
          overflow-hidden
          text-white
        "
      >

        {/* Círculos decorativos */}
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full border border-white/10" />

        <div className="absolute -bottom-44 -left-44 w-[430px] h-[430px] rounded-full border border-white/10" />

        {/* Título */}
        <div className="relative z-10 mb-12">
          <h1 className="text-5xl font-semibold tracking-wide">
            Selección de Contexto
          </h1>

          <div className="w-24 h-1 bg-[#a9e876] rounded-full mt-5" />

          <p className="text-xl text-white/75 mt-5">
            Seleccione el proyecto o bodega con el que desea trabajar
          </p>
        </div>

        {/* ================================================== */}
        {/* BODEGAS */}
        {/* ================================================== */}

        {contextos.bodegas?.length > 0 && (
          <div className="relative z-10 mb-8">

            <h2 className="text-lg text-white/70 mb-4">
              Bodegas disponibles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {contextos.bodegas.map((bodega) => (
                <button
                  key={bodega.id_bodega}
                  type="button"
                  onClick={() => seleccionarBodega(bodega)}
                  className="
                    group
                    w-full
                    bg-white/10
                    hover:bg-white/20
                    backdrop-blur-sm
                    border border-white/25
                    rounded-2xl
                    p-6
                    text-left
                    transition-all
                    hover:-translate-y-1
                    hover:shadow-xl
                    cursor-pointer
                  "
                >
                  <div className="flex items-center gap-5">

                    {/* Icono */}
                    <div
                      className="
                        shrink-0
                        w-16 h-16
                        bg-white/85
                        rounded-full
                        flex items-center justify-center
                        text-3xl
                      "
                    >
                      🏢
                    </div>

                    {/* Información */}
                    <div className="flex-1">

                      <h3 className="text-xl font-semibold text-white">
                        {bodega.nombre}
                      </h3>

                      <p className="text-white/65 mt-1">
                        {bodega.codigo}
                      </p>

                      <p className="text-white/65 text-sm mt-1">
                        {bodega.ubicacion}
                      </p>

                    </div>

                    <div
                      className="
                        w-11 h-11
                        rounded-full
                        bg-white/15
                        flex items-center justify-center
                        text-2xl
                        group-hover:bg-white/25
                        group-hover:translate-x-1
                        transition-all
                      "
                    >
                      →
                    </div>

                  </div>
                </button>
              ))}

            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* PROYECTOS */}
        {/* ================================================== */}

        {contextos.proyectos?.length > 0 && (
          <div className="relative z-10 mb-8">

            <h2 className="text-lg text-white/70 mb-4">
              Proyectos disponibles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {contextos.proyectos.map((proyecto) => (
                <button
                  key={proyecto.id_proyecto}
                  type="button"
                  onClick={() => seleccionarProyecto(proyecto)}
                  className="
                    group
                    w-full
                    bg-white/10
                    hover:bg-white/20
                    backdrop-blur-sm
                    border border-white/25
                    rounded-2xl
                    p-6
                    text-left
                    transition-all
                    hover:-translate-y-1
                    hover:shadow-xl
                    cursor-pointer
                  "
                >

                  <div className="flex items-center gap-5">

                    {/* Icono */}
                    <div
                      className="
                        shrink-0
                        w-16 h-16
                        bg-white/85
                        rounded-full
                        flex items-center justify-center
                        text-3xl
                      "
                    >
                      🏗️
                    </div>

                    {/* Información */}
                    <div className="flex-1">

                      <h3 className="text-xl font-semibold text-white">
                        {proyecto.nombre}
                      </h3>

                      <p className="text-white/65 mt-1">
                        {proyecto.ubicacion}
                      </p>

                    </div>

                    <div
                      className="
                        w-11 h-11
                        rounded-full
                        bg-white/15
                        flex items-center justify-center
                        text-2xl
                        group-hover:bg-white/25
                        group-hover:translate-x-1
                        transition-all
                      "
                    >
                      →
                    </div>

                  </div>

                </button>
              ))}

            </div>
          </div>
        )}

        {/* Información inferior */}
        <div
          className="
            relative z-10
            mt-8
            bg-white/10
            border border-white/20
            rounded-2xl
            px-6 py-5
            flex items-center gap-4
            text-white/80
          "
        >
          <div
            className="
              w-9 h-9
              border border-white/60
              rounded-full
              flex items-center justify-center
              font-semibold
            "
          >
            i
          </div>

          <p>
            Seleccione un contexto para continuar.
          </p>
        </div>

      </div>
    </section>
  </main>
);
}