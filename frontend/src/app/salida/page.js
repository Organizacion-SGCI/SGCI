"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ModalValeSalida from "@/components/ModalValeSalida";

import { obtenerInventario } from "@/services/inventarioService";
import { obtenerProyectosActivos } from "@/services/proyectoService";
import { registrarSalida } from "@/services/salidaService";

export default function Salida() {
    const router = useRouter();

    const [usuario, setUsuario] = useState(null);
    const [contexto, setContexto] = useState(null);
    const [inventario, setInventario] = useState([]);
    const [proyectos, setProyectos] = useState([]);

    const [formulario, setFormulario] = useState({
        id_material: "",
        cantidad: "",
        id_proyecto: "",
        observacion: "",
    });

    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");
    const [valeGenerado, setValeGenerado] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const usuarioGuardado = sessionStorage.getItem("usuario");
                const contextoGuardado = sessionStorage.getItem("contexto");

                if (!token) {
                    router.push("/");
                    return;
                }

                if (!contextoGuardado) {
                    router.push("/contexto");
                    return;
                }

                const usuarioActual = JSON.parse(usuarioGuardado);
                const contextoActual = JSON.parse(contextoGuardado);

                setUsuario(usuarioActual);
                setContexto(contextoActual);

                if (!contextoActual.id_bodega) {
                    setError("El contexto seleccionado no corresponde a una bodega.");
                    return;
                }

                const datosInventario = await obtenerInventario(
                    contextoActual.id_bodega,
                    token
                );
                setInventario(datosInventario.materiales || []);

                const proyectosActivos = await obtenerProyectosActivos(token);
                setProyectos(proyectosActivos);
            } catch (err) {
                console.error("Error al cargar datos:", err);
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [router]);

    const manejarCambio = (event) => {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
        setError("");
    };

    const materialSeleccionado = inventario.find(
        (m) => m.id_material === Number(formulario.id_material)
    );

    const enviarFormulario = async (event) => {
        event.preventDefault();

        if (!formulario.id_material || !formulario.cantidad || !formulario.id_proyecto) {
            setError("Debe completar todos los campos obligatorios.");
            return;
        }

        if (Number(formulario.cantidad) <= 0) {
            setError("La cantidad debe ser mayor que 0.");
            return;
        }

        try {
            setEnviando(true);
            setError("");

            const token = sessionStorage.getItem("token");

            const resultado = await registrarSalida(
                formulario.id_material,
                formulario.cantidad,
                contexto.id_bodega,
                formulario.id_proyecto,
                formulario.observacion,
                token
            );

            setValeGenerado(resultado);
        } catch (err) {
            console.error("Error al registrar salida:", err);
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    const reiniciarFormulario = () => {
        setFormulario({
            id_material: "",
            cantidad: "",
            id_proyecto: "",
            observacion: "",
        });
        setValeGenerado(null);
        setError("");
    };

    if (cargando) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#f7f8f3]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#145c42] border-t-transparent" />
                    <p className="font-medium text-[#145c42]">Cargando...</p>
                </div>
            </main>
        );
    }

    const fechaHoy = new Date().toISOString().split("T")[0];

    return (
        <main className="min-h-screen bg-[#f7f8f3]">
            <Header usuario={usuario} titulo="Emitir vale de materiales" />

            <Sidebar usuario={usuario} activo="salida" />

            <section className="min-h-screen pt-[120px] pl-[270px] pr-10 pb-12">
                <div className="mx-auto max-w-5xl">

                    {/* ENCABEZADO */}
                    <div className="mb-8">
                        <p className="mb-1 text-sm font-medium text-[#65907e]">
                            Gestión de salida de materiales
                        </p>
                        <h1 className="text-3xl font-semibold text-[#173d30]">
                            Emitir vale de materiales
                        </h1>
                        <p className="mt-2 text-gray-500">
                            Registre la salida de materiales hacia un proyecto.
                        </p>
                    </div>

                    {/* TARJETA DEL FORMULARIO */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                        <div className="flex items-center justify-between bg-[#145c42] px-8 py-5">
                            <h2 className="text-lg font-semibold text-white">
                                Datos del vale
                            </h2>
                            <span className="text-xs text-white/70">
                                Campos requeridos *
                            </span>
                        </div>

                        <form onSubmit={enviarFormulario} className="p-8">

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                                {/* MATERIAL */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                                        Material *
                                    </label>
                                    <select
                                        name="id_material"
                                        value={formulario.id_material}
                                        onChange={manejarCambio}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
                                    >
                                        <option value="">Seleccione un material</option>
                                        {inventario.map((m) => (
                                            <option key={m.id_material} value={m.id_material}>
                                                {m.codigo} - {m.nombre}
                                            </option>
                                        ))}
                                    </select>

                                    {materialSeleccionado && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Disponible: {materialSeleccionado.cantidad}{" "}
                                            {materialSeleccionado.unidad_medida}
                                        </p>
                                    )}
                                </div>

                                {/* CANTIDAD */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                                        Cantidad *
                                    </label>
                                    <input
                                        type="number"
                                        name="cantidad"
                                        min="1"
                                        value={formulario.cantidad}
                                        onChange={manejarCambio}
                                        placeholder="Ingrese la cantidad"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
                                    />
                                </div>

                                {/* PROYECTO */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                                        Proyecto *
                                    </label>
                                    <select
                                        name="id_proyecto"
                                        value={formulario.id_proyecto}
                                        onChange={manejarCambio}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
                                    >
                                        <option value="">Seleccione un proyecto</option>
                                        {proyectos.map((p) => (
                                            <option key={p.id_proyecto} value={p.id_proyecto}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* FECHA (readonly) */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaHoy}
                                        readOnly
                                        disabled
                                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">
                                        La fecha se registra automáticamente
                                    </p>
                                </div>

                                {/* RESPONSABLE (readonly) */}
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                                        Responsable
                                    </label>
                                    <input
                                        type="text"
                                        value={usuario?.nombre || ""}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">
                                        El responsable se toma de la sesión activa
                                    </p>
                                </div>

                                {/* OBSERVACIONES */}
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                                        Observaciones
                                    </label>
                                    <textarea
                                        name="observacion"
                                        value={formulario.observacion}
                                        onChange={manejarCambio}
                                        rows="3"
                                        placeholder="Notas adicionales sobre esta salida de materiales"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
                                    />
                                </div>

                            </div>

                            {/* ERROR */}
                            {error && (
                                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* BOTONES */}
                            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
                                <button
                                    type="button"
                                    onClick={reiniciarFormulario}
                                    disabled={enviando}
                                    className="cursor-pointer rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="cursor-pointer rounded-xl bg-[#145c42] px-7 py-3 font-semibold text-white transition hover:bg-[#0f4934] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {enviando ? "Emitiendo..." : "Emitir Vale"}
                                </button>
                            </div>

                        </form>

                    </div>

                </div>
            </section>

            {/* MODAL DEL VALE */}
            <ModalValeSalida
                abierto={!!valeGenerado}
                vale={valeGenerado}
                onCerrar={reiniciarFormulario}
                onEmitirOtro={reiniciarFormulario}
            />

        </main>
    );
}