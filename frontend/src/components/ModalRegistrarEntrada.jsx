"use client";

import { useEffect, useState } from "react";
import { registrarEntrada } from "@/services/entradaService";
import { useRouter } from "next/navigation";

export default function ModalRegistrarEntrada({
  abierto,
  onCerrar,
  onEntradaRegistrada,
}) {
  const router = useRouter();
  const materiales = [
    { id: 1, codigo: "MAT-001", nombre: "Cemento" },
    { id: 2, codigo: "MAT-002", nombre: "Arena" },
    { id: 3, codigo: "MAT-003", nombre: "Bloques" },
    { id: 4, codigo: "MAT-004", nombre: "Varilla" },
    { id: 5, codigo: "MAT-005", nombre: "Piedra" },
  ];

  const proveedores = [
    { id: 1, nombre: "Ferretería El Constructor" },
  ];

  const [responsable, setResponsable] = useState("");

  const [formulario, setFormulario] = useState({
    material: "",
    cantidad: "",
    proveedor: "",
    fecha: "",
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [entradaRegistrada, setEntradaRegistrada] = useState(null);
  

  useEffect(() => {
    if (!abierto) return;

    const usuarioGuardado = sessionStorage.getItem("usuario");
    

    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setResponsable(usuario.nombre || "");
        setEntradaRegistrada(null);
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      }
    }

    // Colocar automáticamente la fecha actual
    const hoy = new Date().toISOString().split("T")[0];

    setFormulario({
      material: "",
      cantidad: "",
      proveedor: "",
      fecha: hoy,
    });

    setError("");
  }, [abierto]);

  if (!abierto) return null;

  const manejarCambio = (event) => {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const confirmarEntrada = async () => {
    if (
      !formulario.material ||
      !formulario.cantidad ||
      !formulario.proveedor ||
      !formulario.fecha
    ) {
      setError("Debe completar todos los campos.");
      return;
    }

    if (Number(formulario.cantidad) <= 0) {
      setError("La cantidad debe ser mayor que 0.");
      return;
    }

    try {
      setCargando(true);
      setError("");

      const token = sessionStorage.getItem("token");
      const contextoGuardado = sessionStorage.getItem("contexto");

      if (!token || !contextoGuardado) {
        setError("No se encontró la sesión o el contexto seleccionado.");
        return;
      }

      const contexto = JSON.parse(contextoGuardado);

      if (!contexto.id_bodega) {
        setError("El contexto seleccionado no tiene una bodega asociada.");
        return;
      }

    const resultado = await registrarEntrada(
  formulario.material,
  formulario.cantidad,
  contexto.id_bodega,
  formulario.proveedor,
  "",
  token
);

const materialSeleccionado = materiales.find(
  (material) => material.id === Number(formulario.material)
);

const proveedorSeleccionado = proveedores.find(
  (proveedor) => proveedor.id === Number(formulario.proveedor)
);

setEntradaRegistrada({
  ...resultado,
  materialNombre: materialSeleccionado?.nombre || "Material",
  materialCodigo: materialSeleccionado?.codigo || "",
  proveedorNombre: proveedorSeleccionado?.nombre || "Proveedor",
  responsable,
  fechaSeleccionada: resultado.fecha_movimiento || formulario.fecha,
});

await onEntradaRegistrada(resultado);
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };


  if (entradaRegistrada) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        <div className="bg-[#145c42] px-7 py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#145c42]">
            ✓
          </div>

          <h2 className="text-xl font-semibold text-white">
            Entrada registrada correctamente
          </h2>

          <p className="mt-1 text-sm text-white/70">
            El movimiento fue registrado en el inventario
          </p>
        </div>

        <div className="p-7">

          <div className="space-y-4 rounded-xl bg-[#f7f8f3] p-5">

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Movimiento</span>

              <span className="font-semibold text-[#173d30]">
                #{entradaRegistrada.id_movimiento}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Material</span>

              <span className="font-semibold text-[#173d30]">
                {entradaRegistrada.materialCodigo} -{" "}
                {entradaRegistrada.materialNombre}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Cantidad</span>

              <span className="font-semibold text-[#173d30]">
                {entradaRegistrada.cantidad}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Proveedor</span>

              <span className="font-semibold text-[#173d30]">
                {entradaRegistrada.proveedorNombre}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Responsable</span>

              <span className="font-semibold text-[#173d30]">
                {entradaRegistrada.responsable}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Fecha</span>

              <span className="font-semibold text-[#173d30]">
                {new Date(
  entradaRegistrada.fechaSeleccionada
).toLocaleString("es-CR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})}
              </span>
            </div>

          </div>

                    <div className="mt-6 flex gap-3">

            <button
              type="button"
              onClick={onCerrar}
              className="w-full cursor-pointer rounded-xl border border-[#145c42] px-6 py-3 font-semibold text-[#145c42] transition hover:bg-[#dcefd7]"
            >
              Aceptar
            </button>

            {/* H-08.2: lleva al comprobante del ingreso recién registrado */}
            <button
              type="button"
              onClick={() => {
                onCerrar();
                router.push(
                  `/inventario/comprobante/${entradaRegistrada.id_movimiento}`
                );
              }}
              className="w-full cursor-pointer rounded-xl bg-[#145c42] px-6 py-3 font-semibold text-white transition hover:bg-[#0f4934]"
            >
              Ver comprobante
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      {/* VENTANA */}
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* CABECERA */}
        <div className="flex items-center justify-between bg-[#145c42] px-7 py-5">

          <div>
            <h2 className="text-xl font-semibold text-white">
              Registrar entrada de materiales
            </h2>

            <p className="mt-1 text-sm text-white/70">
              Complete los datos del material recibido
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-2xl text-white transition hover:bg-white/20"
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>

        {/* FORMULARIO */}
        <div className="p-7">

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* MATERIAL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Material *
              </label>

              <select
                name="material"
                value={formulario.material}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              >
                <option value="">Seleccione un material</option>

                {materiales.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.codigo} - {material.nombre}
                  </option>
                ))}
              </select>
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

            {/* PROVEEDOR */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Proveedor *
              </label>

              <select
                name="proveedor"
                value={formulario.proveedor}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              >
                <option value="">Seleccione un proveedor</option>

                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* FECHA */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Fecha *
              </label>

              <input
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#173d30] outline-none focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              />
            </div>

            {/* RESPONSABLE */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Responsable
              </label>

              <input
                type="text"
                value={responsable}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
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
              onClick={onCerrar}
              disabled={cargando}
              className="cursor-pointer rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmarEntrada}
              disabled={cargando}
              className="cursor-pointer rounded-xl bg-[#145c42] px-7 py-3 font-semibold text-white transition hover:bg-[#0f4934] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Registrando..." : "Confirmar entrada"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}