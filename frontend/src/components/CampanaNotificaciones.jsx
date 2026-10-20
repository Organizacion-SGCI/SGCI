"use client";

import { useEffect, useState } from "react";
import { obtener_notificaciones } from "@/services/notificacionService";

export default function CampanaNotificaciones({ token }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                const datos = await obtener_notificaciones(token);
                setNotificaciones(datos);
            } catch (error) {
                console.error("Error al cargar notificaciones:", error);
            } finally {
                setCargando(false);
            }
        };

        if (token) cargar();
    }, [token]);

    const no_leidas = notificaciones.filter((n) => !n.leida).length;

    const formatear_fecha = (fecha_str) => {
        const fecha = new Date(fecha_str);
        return fecha.toLocaleString("es-CR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setAbierto(!abierto)}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#145c42] text-[#dcefd7] transition hover:bg-[#0f4934]"
            >
                {/* Ícono de campana SVG */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                </svg>

                {no_leidas > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                        {no_leidas}
                    </span>
                )}
            </button>

            {abierto && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setAbierto(false)}
                    />

                    <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl">
                        <div className="bg-[#145c42] px-4 py-3">
                            <h3 className="font-semibold text-white">Notificaciones</h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {cargando ? (
                                <p className="p-4 text-center text-sm text-gray-500">
                                    Cargando...
                                </p>
                            ) : notificaciones.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-500">
                                    No tienes notificaciones.
                                </p>
                            ) : (
                                notificaciones.map((noti) => (
                                    <div
                                        key={noti.id_notificacion}
                                        className={`border-b border-gray-100 p-4 transition hover:bg-gray-50 ${!noti.leida ? "bg-green-50/50" : ""
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-[#173d30]">
                                                {noti.titulo}
                                            </p>
                                            {!noti.leida && (
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {noti.mensaje}
                                        </p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            {formatear_fecha(noti.fecha_creacion)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}