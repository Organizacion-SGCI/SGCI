"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CampanaNotificaciones from "@/components/CampanaNotificaciones";

export default function Header({ usuario, titulo }) {
  const router = useRouter();
  const [token, setToken] = useState("");

  // Recuperamos el token para la campana
  useEffect(() => {
    setToken(sessionStorage.getItem("token") || "");
  }, []);

  return (
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
      {/* LOGO */}
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
        {titulo}
      </h1>

      {/* USUARIO Y CAMPANA */}
       <div className="flex items-center gap-5">
        <div className="text-right hidden md:block">
          <p className="text-[#124c38] font-semibold">
            {usuario?.nombre}
          </p>
          <p className="text-sm text-[#39715c]">
            {usuario?.rol}
          </p>
        </div>

        <CampanaNotificaciones token={token} />
      </div>
    </header>
  );
}