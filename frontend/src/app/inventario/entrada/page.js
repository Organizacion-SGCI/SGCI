"use client";

import { useEffect, useState } from "react";

export default function EntradaMateriales() {
  // =========================================================
  // DATOS MOCK
  // Datos temporales mientras el backend de H-07.1
  // todavía no está disponible.
  // =========================================================

  const materialesMock = [
    { id: 1, codigo: "MAT-001", nombre: "Cemento" },
    { id: 2, codigo: "MAT-002", nombre: "Arena" },
    { id: 3, codigo: "MAT-003", nombre: "Bloques" },
    { id: 4, codigo: "MAT-004", nombre: "Varilla" },
    { id: 5, codigo: "MAT-005", nombre: "Piedra" },
  ];

  const proveedoresMock = [
    { id: 1, nombre: "Proveedor A" },
    { id: 2, nombre: "Proveedor B" },
    { id: 3, nombre: "Proveedor C" },
  ];

  // =========================================================
  // ESTADOS
  // =========================================================

  const [responsable, setResponsable] = useState("");

  const [formulario, setFormulario] = useState({
    material: "",
    cantidad: "",
    proveedor: "",
    fecha: "",
  });

  // Estado utilizado para mostrar mensajes dentro de un modal
  const [modal, setModal] = useState({
    visible: false,
    tipo: "",
    titulo: "",
    mensaje: "",
  });

  // =========================================================
  // OBTENER USUARIO DE LA SESIÓN
  // =========================================================

  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem("usuario");

    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setResponsable(usuario.nombre || "");
      } catch (error) {
        console.error("Error al obtener el usuario de la sesión:", error);
      }
    }
  }, []);

  // =========================================================
  // MANEJO DEL FORMULARIO
  // =========================================================

  const manejarCambio = (event) => {
    const { name, value } = event.target;

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: value,
    }));
  };

  // =========================================================
  // MODAL
  // =========================================================

  const mostrarModal = (tipo, titulo, mensaje) => {
    setModal({
      visible: true,
      tipo,
      titulo,
      mensaje,
    });
  };

  const cerrarModal = () => {
    setModal({
      visible: false,
      tipo: "",
      titulo: "",
      mensaje: "",
    });
  };

  // =========================================================
  // CONFIRMAR ENTRADA
  // =========================================================

  const confirmarEntrada = () => {
    // Validar campos obligatorios
    if (
      !formulario.material ||
      !formulario.cantidad ||
      !formulario.proveedor ||
      !formulario.fecha
    ) {
      mostrarModal(
        "error",
        "Campos requeridos",
        "Debe completar todos los campos."
      );

      return;
    }

    // Validar que la cantidad sea válida
    if (Number(formulario.cantidad) <= 0) {
      mostrarModal(
        "error",
        "Cantidad inválida",
        "La cantidad debe ser mayor que 0."
      );

      return;
    }

    // =======================================================
    // SIMULACIÓN DEL REGISTRO
    // Más adelante será reemplazado por la llamada al
    // endpoint real correspondiente a H-07.1.
    // =======================================================

    const entradaMock = {
      material: formulario.material,
      cantidad: Number(formulario.cantidad),
      proveedor: formulario.proveedor,
      fecha: formulario.fecha,
      responsable: responsable || "Usuario de prueba",
    };

    console.log("Entrada simulada:", entradaMock);

    mostrarModal(
      "exito",
      "Entrada validada",
      "Los datos de la entrada fueron validados correctamente."
    );
  };

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8f3] p-6 md:p-10">
      <div className="mx-auto max-w-3xl">

        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <div className="mb-8">
          <p className="mb-1 text-sm font-medium text-[#65907e]">
            Gestión de inventario
          </p>

          <h1 className="text-3xl font-semibold text-[#173d30]">
            Registrar entrada de materiales
          </h1>

          <p className="mt-2 text-gray-500">
            Registre los materiales recibidos de un proveedor.
          </p>
        </div>

        {/* ===================================================
            FORMULARIO
        =================================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* MATERIAL */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Material
              </label>

              <select
                name="material"
                value={formulario.material}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none transition focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              >
                <option value="">
                  Seleccione un material
                </option>

                {materialesMock.map((material) => (
                  <option
                    key={material.id}
                    value={material.id}
                  >
                    {material.codigo} - {material.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* CANTIDAD */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Cantidad
              </label>

              <input
                type="number"
                name="cantidad"
                min="1"
                value={formulario.cantidad}
                onChange={manejarCambio}
                placeholder="Ingrese la cantidad"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none transition placeholder:text-gray-400 focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              />
            </div>

            {/* PROVEEDOR */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Proveedor
              </label>

              <select
                name="proveedor"
                value={formulario.proveedor}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none transition focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
              >
                <option value="">
                  Seleccione un proveedor
                </option>

                {proveedoresMock.map((proveedor) => (
                  <option
                    key={proveedor.id}
                    value={proveedor.id}
                  >
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* FECHA */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173d30]">
                Fecha
              </label>

              <input
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={manejarCambio}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#173d30] outline-none transition focus:border-[#65907e] focus:ring-2 focus:ring-[#65907e]/20"
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
                placeholder="Usuario responsable"
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 outline-none"
              />

              {!responsable && (
                <p className="mt-2 text-xs text-gray-400">
                  El responsable se obtiene automáticamente del usuario
                  que inició sesión.
                </p>
              )}
            </div>

          </div>

          {/* BOTÓN CONFIRMAR */}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={confirmarEntrada}
              className="cursor-pointer rounded-xl bg-[#145c42] px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0f4934] active:scale-[0.98]"
            >
              Confirmar entrada
            </button>
          </div>

        </div>
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {modal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* ENCABEZADO DEL MODAL */}

            <div className="flex items-center justify-between bg-[#145c42] px-6 py-4">

              <h2 className="text-xl font-semibold text-white">
                {modal.titulo}
              </h2>

              <button
                type="button"
                onClick={cerrarModal}
                className="cursor-pointer text-2xl leading-none text-white transition hover:opacity-70"
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            {/* CONTENIDO DEL MODAL */}

            <div className="p-6">

              <div
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  modal.tipo === "exito"
                    ? "bg-green-50"
                    : "bg-amber-50"
                }`}
              >

                {/* ICONO */}

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold ${
                    modal.tipo === "exito"
                      ? "border-green-600 text-green-600"
                      : "border-amber-500 text-amber-500"
                  }`}
                >
                  {modal.tipo === "exito" ? "✓" : "!"}
                </div>

                {/* MENSAJE */}

                <p className="text-base text-[#173d30]">
                  {modal.mensaje}
                </p>

              </div>
            </div>

            {/* PIE DEL MODAL */}

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">

              <button
                type="button"
                onClick={cerrarModal}
                className="cursor-pointer rounded-xl bg-[#145c42] px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0f4934] active:scale-[0.98]"
              >
                Aceptar
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}