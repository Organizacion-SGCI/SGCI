"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { iniciarSesion } from "@/services/authService";

export default function Login() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      const datos = await iniciarSesion(correo, password);

      //solo el usuario 
      sessionStorage.setItem("usuario", JSON.stringify(datos.usuario));

      sessionStorage.setItem("token", datos.token);

      // Cookie para que el middleware del servidor pueda leer el rol.
      // 3600 segundos = 1 hora (se puede ajustar después).
      document.cookie = `usuario_rol=${encodeURIComponent(datos.usuario.rol)}; path=/; max-age=3600; SameSite=Lax`;

      router.push("/contexto");
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main
      className="relative min-h-screen bg-cover bg-center flex items-center justify-end px-6 md:px-12 lg:px-16 py-8 overflow-hidden"
      style={{
        backgroundImage: "url('/images/fondo-login.jpg')",
      }}
    >
      {/* Oscurecimiento suave del fondo */}
      <div className="absolute inset-0 bg-black/15"></div>

      {/* Arco decorativo superior */}
      <div className="absolute top-0 left-0 w-[520px] h-[520px] border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10" />

      {/* ====================================================== */}
      {/* LOGO SUPERIOR */}
      {/* ====================================================== */}
      <div
        className="
          absolute top-0 left-0 z-20
          bg-white/60
          backdrop-blur-md
          px-6 py-3
          w-[360px] md:w-[430px]
          rounded-br-[30px]
          border-r border-b border-white/30
          shadow-sm
          flex items-center gap-3
        "
      >
        <img
          src="/images/logo-parque-tempisque.png"
          alt="Logo Parque Tempisque"
          className="h-12 md:h-14 w-auto object-contain"
        />

        <span className="text-[#315c49] text-xl md:text-2xl font-semibold whitespace-nowrap">
          Parque Tempisque
        </span>
      </div>

      {/* ====================================================== */}
      {/* PANEL PRINCIPAL */}
      {/* ====================================================== */}
      <div
        className="
          relative z-10
          w-full
          max-w-[780px]
          min-h-[720px]
          bg-gradient-to-br
          from-[#0c392b]/80
          via-[#184e37]/75
          to-[#4d8a45]/70
          backdrop-blur-md
          border border-white/25
          rounded-[42px]
          px-12 py-14
          md:px-20 md:py-16
          text-white
          shadow-2xl
          overflow-hidden
          flex flex-col
          justify-center
        "
      >
        {/* Decoraciones */}
        <div className="absolute -top-32 -right-32 w-[450px] h-[450px] border border-white/10 rounded-full pointer-events-none" />

        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] border border-white/10 rounded-full pointer-events-none" />

        <div className="absolute top-1/2 -right-40 w-[350px] h-[350px] border border-white/10 rounded-full pointer-events-none" />

        {/* ====================================================== */}
        {/* TÍTULO */}
        {/* ====================================================== */}
        <div className="relative z-10 mb-12">
          <h1 className="text-5xl md:text-6xl font-light tracking-wide">
            Login
          </h1>

          <p className="text-xl md:text-2xl mt-4 text-white/90 underline underline-offset-8 decoration-white/50 font-light">
            Bienvenidos al sistema
          </p>
        </div>

        {/* ====================================================== */}
        {/* FORMULARIO */}
        {/* ====================================================== */}
        <form onSubmit={manejarSubmit} className="relative z-10 space-y-8">
          {/* USUARIO */}
          <div>
            <label
              htmlFor="correo"
              className="block text-lg md:text-xl font-light mb-3 text-white/95"
            >
              Username
            </label>

            <input
              id="correo"
              type="text"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingrese su usuario"
              required
              className="
                w-full
                px-6 py-5
                bg-white/15
                backdrop-blur-sm
                border border-white/25
                rounded-xl
                text-white
                text-lg
                placeholder:text-white/55
                outline-none
                focus:bg-white/20
                focus:border-white/60
                focus:ring-2
                focus:ring-white/15
                transition-all
              "
            />
          </div>

          {/* CONTRASEÑA */}
          <div>
            <label
              htmlFor="password"
              className="block text-lg md:text-xl font-light mb-3 text-white/95"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
              className="
                w-full
                px-6 py-5
                bg-white/15
                backdrop-blur-sm
                border border-white/25
                rounded-xl
                text-white
                text-lg
                placeholder:text-white/55
                outline-none
                focus:bg-white/20
                focus:border-white/60
                focus:ring-2
                focus:ring-white/15
                transition-all
              "
            />

            <div className="text-right mt-3">
              <a
                href="#olvido-password"
                className="text-sm md:text-base text-white/80 hover:text-white hover:underline transition"
              >
                Olvido su contraseña?
              </a>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/70 backdrop-blur-sm border border-red-300/50 text-white px-6 py-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* LOGIN */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="
                w-full
                bg-[#c2e2a3]/90
                hover:bg-[#ccebab]
                active:scale-[0.99]
                disabled:opacity-60
                text-gray-900
                font-bold
                py-5
                rounded-xl
                transition-all
                cursor-pointer
                disabled:cursor-not-allowed
                shadow-lg
                text-lg
                tracking-wider
              "
            >
              {cargando ? "Cargando..." : "LOGIN"}
            </button>
          </div>

          {/* REGISTRO */}
          <div className="text-right pt-2">
            <span className="text-sm md:text-base text-white/90 font-light">
              Nuevo usuario?{" "}
              <a href="#registro" className="font-bold hover:underline ml-1">
                Registrese aqui
              </a>
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}