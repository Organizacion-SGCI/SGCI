"use client";

import { useRouter } from "next/navigation";

export default function ModalCerrarSesion({ abierto, onCerrar }) {
    const router = useRouter();

    if (!abierto) return null;

    const confirmarCierre = () => {
        sessionStorage.clear();
        document.cookie = "usuario_rol=; path=/; max-age=0";
        router.push("/");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* CABECERA ROJA */}
                <div className="bg-red-600 px-7 py-6 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-red-600">
                    </div>

                    <h2 className="text-xl font-semibold text-white">
                        Cerrar sesión
                    </h2>

                    <p className="mt-1 text-sm text-white/80">
                        ¿Estás seguro que deseas salir del sistema?
                    </p>
                </div>

                {/* CUERPO */}
                <div className="p-7">

                    <p className="mb-6 text-center text-sm text-gray-500">
                        Tendrás que volver a ingresar tus credenciales para acceder nuevamente.
                    </p>

                    {/* BOTONES */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCerrar}
                            className="w-full cursor-pointer rounded-xl border border-gray-500 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 hover:text-black"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={confirmarCierre}
                            className="w-full cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Sí, cerrar sesión
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}