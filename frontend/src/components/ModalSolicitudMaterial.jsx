"use client";

import { useEffect, useRef, useState } from "react";
import {
  crearSolicitud,
  obtenerBodegas,
} from "@/services/solicitudService";
import { obtenerInventario } from "@/services/inventarioService";

export default function ModalSolicitudMaterial({
  abierto,
  onCerrar,
  onSolicitudRegistrada,
}) {
  const dialogoRef = useRef(null);
  const enviandoRef = useRef(false);

  const [usuario, setUsuario] = useState(null);
  const [bodegaSolicitante, setBodegaSolicitante] = useState(null);
  const [central, setCentral] = useState(null);
  const [materiales, setMateriales] = useState([]);

  const [idMaterial, setIdMaterial] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [prioridad, setPrioridad] = useState("MEDIA");
  const [listadoMateriales, setListadoMateriales] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!abierto) return;

    let activo = true;
    const elementoAnterior = document.activeElement;

    dialogoRef.current?.showModal();

    setIdMaterial("");
    setCantidad("");
    setListadoMateriales([]);
    setPrioridad("MEDIA");
    setResultado(null);
    setError("");
    setCentral(null);
    setMateriales([]);
    setUsuario(null);
    setBodegaSolicitante(null);
    setCargando(true);

    const cargarDatos = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const usuarioActual = JSON.parse(
          sessionStorage.getItem("usuario") || "null"
        );
        const contexto = JSON.parse(
          sessionStorage.getItem("contexto") || "null"
        );

        if (!token || !usuarioActual) {
          throw new Error("Debe iniciar sesión para solicitar materiales.");
        }

        if (usuarioActual.rol !== "Encargado") {
          throw new Error(
            "Esta opción corresponde al Encargado de Bodega."
          );
        }

        if (!contexto?.id_bodega) {
          throw new Error("Primero seleccione una bodega.");
        }

        const bodegas = await obtenerBodegas(token);

        const solicitante = bodegas.find(
          (bodega) =>
            Number(bodega.id_bodega) === Number(contexto.id_bodega)
        );

        if (solicitante?.tipo !== "SATELITE") {
          throw new Error(
            "Las solicitudes deben realizarse desde una bodega satélite."
          );
        }

        const centrales = bodegas.filter(
          (bodega) => bodega.tipo === "CENTRAL"
        );

        if (centrales.length !== 1) {
          throw new Error(
            "No se pudo identificar una única bodega central."
          );
        }

        const bodegaCentral = centrales[0];
        const inventario = await obtenerInventario(
          bodegaCentral.id_bodega,
          token
        );

        if (!Array.isArray(inventario?.materiales)) {
          throw new Error("No se pudo cargar el listado de materiales.");
        }

        if (!activo) return;

        setUsuario(usuarioActual);
        setBodegaSolicitante(solicitante);
        setCentral(bodegaCentral);
        setMateriales(inventario.materiales);
      } catch (error) {
        if (activo) {
          setError(error.message || "No se pudo cargar el formulario.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDatos();

    return () => {
      activo = false;
      elementoAnterior?.focus?.();
    };
  }, [abierto]);

  const cerrar = () => {
    if (enviandoRef.current) return;
    dialogoRef.current?.close();
    onCerrar();
  };


  const agregarMaterial = () => {
  if (enviandoRef.current) return;

  setError("");

  const material = materiales.find(
    (item) => Number(item.id_material) === Number(idMaterial)
  );
  const cantidadNumerica = Number(cantidad);

  if (!material) {
    setError("Seleccione un material.");
    return;
  }

  if (
    !Number.isSafeInteger(cantidadNumerica) ||
    cantidadNumerica <= 0
  ) {
    setError("La cantidad debe ser un número entero mayor que cero.");
    return;
  }

  if (
    listadoMateriales.some(
      (item) => item.id_material === Number(material.id_material)
    )
  ) {
    setError(
      "Este material ya está en el listado. Puede quitarlo y agregarlo con otra cantidad."
    );
    return;
  }

  setListadoMateriales((actual) => [
    ...actual,
    {
      id_material: Number(material.id_material),
      codigo: material.codigo,
      nombre: material.nombre,
      tipo: material.tipo,
      cantidad: cantidadNumerica,
    },
  ]);

  setIdMaterial("");
  setCantidad("");
};

const quitarMaterial = (id) => {
  if (enviandoRef.current) return;

  setListadoMateriales((actual) =>
    actual.filter((material) => material.id_material !== id)
  );
  setError("");
};


  const enviarSolicitud = async (event) => {
    event.preventDefault();

    if (enviandoRef.current || resultado) return;

    setError("");

    if (listadoMateriales.length === 0) {
  setError("Agregue al menos un material al listado.");
  return;
}

// Evita enviar mientras queda un material sin agregar.
if (idMaterial !== "" || cantidad !== "") {
  setError(
    "Hay un material sin agregar. Pulse Agregar material o limpie los campos antes de enviar."
  );
  return;
}

const ids = listadoMateriales.map((item) => item.id_material);

if (new Set(ids).size !== ids.length) {
  setError("El listado contiene materiales repetidos.");
  return;
}

if (
  listadoMateriales.some(
    (item) =>
      !materiales.some(
        (material) =>
          Number(material.id_material) === item.id_material
      ) ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad <= 0
  )
) {
  setError("Revise los materiales y las cantidades del listado.");
  return;
}

    if (!["BAJA", "MEDIA", "ALTA", "URGENTE"].includes(prioridad)) {
      setError("Seleccione una prioridad válida.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);

    try {
      const token = sessionStorage.getItem("token");
      const contexto = JSON.parse(
        sessionStorage.getItem("contexto") || "null"
      );

      if (!token) {
        throw new Error("La sesión no está disponible. Inicie sesión.");
      }

      if (
        !central ||
        !bodegaSolicitante ||
        Number(contexto?.id_bodega) !==
          Number(bodegaSolicitante.id_bodega)
      ) {
        throw new Error(
          "El contexto cambió. Cierre el formulario y vuelva a abrirlo."
        );
      }

      const respuesta = await crearSolicitud(
        {
          id_bodega_origen: Number(bodegaSolicitante.id_bodega),
          id_bodega_destino: Number(central.id_bodega),
          prioridad,
          materiales: listadoMateriales.map((material) => ({
  id_material: material.id_material,
  cantidad: material.cantidad,
})),
        },
        token
      );

      setResultado(respuesta);
    } catch (error) {
      setError(
        error.message ||
          "No se pudo confirmar el envío. Revise el listado antes de reintentar."
      );
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const aceptarConfirmacion = () => {
    // La solicitud ya fue guardada; actualizar la tabla no debe reenviarla.
    try {
      onSolicitudRegistrada?.(resultado);
    } finally {
      cerrar();
    }
  };

  if (!abierto) return null;

  const materialSeleccionado = materiales.find(
    (material) => Number(material.id_material) === Number(idMaterial)
  );

  const claseCampo =
    "w-full rounded-xl border border-white/25 bg-white px-4 py-3 " +
    "text-[#173d30] outline-none focus:ring-2 focus:ring-[#b5d58f] " +
    "disabled:bg-gray-200 disabled:text-gray-600";

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-solicitud"
      onCancel={(event) => {
        event.preventDefault();
        if (!resultado) cerrar();
      }}
      className="
        fixed inset-0 m-auto
        max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl
        overflow-y-auto rounded-2xl border border-white/20
        bg-[#354e43] p-0 text-white shadow-2xl
        backdrop:bg-black/50
      "
    >
      <div className="p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="titulo-solicitud"
              className="text-xl font-semibold"
            >
              {resultado
                ? "Confirmación de solicitud"
                : "Solicitar material"}
            </h2>

            <p className="mt-2 text-sm text-white/75">
              {resultado
                ? "La solicitud fue registrada en el sistema."
                : "Solicite materiales a la bodega central."}
            </p>
          </div>

          {!resultado && (
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              aria-label="Cerrar formulario"
              className="
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg bg-[#f3e8d8] text-xl text-[#354e43]
                disabled:opacity-50
              "
            >
              ×
            </button>
          )}
        </div>

        {resultado ? (
          <div className="py-4 text-center" role="status">
            <div className="mb-4 text-4xl text-[#b5d58f]">✓</div>

            <h3 className="text-xl font-semibold">
              Solicitud enviada exitosamente
            </h3>

            <p className="mt-3 text-[#c5dfa9]">
              Esperando respuesta de Bodega Central
            </p>

            <p className="mt-4 text-sm text-white/80">
              Solicitud #{resultado.id_solicitud} · Estado:{" "}
              {resultado.estado}
            </p>

            <button
              type="button"
              onClick={aceptarConfirmacion}
              className="
                mt-8 rounded-xl bg-[#b5d58f] px-8 py-3
                font-semibold text-[#173d30] hover:bg-[#c5dfa9]
              "
            >
              Aceptar
            </button>
          </div>
        ) : cargando ? (
          <p className="py-10 text-center" role="status">
            Cargando datos del formulario...
          </p>
        ) : (
          <form onSubmit={enviarSolicitud}>
            <p className="mb-5 text-right text-xs text-white/70">
              Campos requeridos *
            </p>

            <fieldset disabled={enviando} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="solicitud-material"
                    className="mb-2 block text-sm"
                  >
                    Código y material *
                  </label>

                  <select
                    id="solicitud-material"
                    value={idMaterial}
                    onChange={(event) => setIdMaterial(event.target.value)}
                    className={claseCampo}
                  >
                    <option value="">Seleccione un material</option>
                    {materiales.map((material) => (
                      <option
                        key={material.id_material}
                        value={material.id_material}
                      >
                        {material.codigo} — {material.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="solicitud-cantidad"
                    className="mb-2 block text-sm"
                  >
                    Cantidad *
                  </label>

                  <input
                    id="solicitud-cantidad"
                    type="number"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    className={claseCampo}
                    placeholder="Ingrese la cantidad"
                  />
                </div>

                <div>
                  <label
                    htmlFor="solicitud-encargado"
                    className="mb-2 block text-sm"
                  >
                    Encargado
                  </label>

                  <input
                    id="solicitud-encargado"
                    value={usuario?.nombre || ""}
                    readOnly
                    className={claseCampo}
                  />
                </div>

                <div>
                  <label
                    htmlFor="solicitud-tipo"
                    className="mb-2 block text-sm"
                  >
                    Tipo de material
                  </label>

                  <input
                    id="solicitud-tipo"
                    value={materialSeleccionado?.tipo || ""}
                    readOnly
                    className={claseCampo}
                  />
                </div>

                <div>
                  <label
                    htmlFor="solicitud-bodega"
                    className="mb-2 block text-sm"
                  >
                    Bodega solicitante
                  </label>

                  <input
                    id="solicitud-bodega"
                    value={bodegaSolicitante?.nombre || ""}
                    readOnly
                    className={claseCampo}
                  />
                </div>

                <div>
                  <label
                    htmlFor="solicitud-central"
                    className="mb-2 block text-sm"
                  >
                    Dirigida a
                  </label>

                  <input
                    id="solicitud-central"
                    value={central?.nombre || ""}
                    readOnly
                    className={claseCampo}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="solicitud-prioridad"
                    className="mb-2 block text-sm"
                  >
                    Prioridad *
                  </label>

                  <select
                    id="solicitud-prioridad"
                    value={prioridad}
                    onChange={(event) => setPrioridad(event.target.value)}
                    required
                    className={claseCampo}
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
  <p className="text-sm text-white/75">
    Agregue cada material al listado antes de enviar.
  </p>

  <button
    type="button"
    onClick={agregarMaterial}
    disabled={!central || materiales.length === 0}
    className="
      rounded-xl bg-[#b5d58f] px-5 py-3
      text-sm font-semibold text-[#173d30]
      hover:bg-[#c5dfa9]
      disabled:cursor-not-allowed disabled:opacity-50
    "
  >
    + Agregar material
  </button>
</div>

<section aria-labelledby="titulo-listado-materiales">
  <div className="mb-3 flex items-center justify-between gap-3">
    <h3
      id="titulo-listado-materiales"
      className="font-semibold"
    >
      Materiales de la solicitud
    </h3>

    <span className="text-sm text-white/75" role="status">
      {listadoMateriales.length} material(es)
    </span>
  </div>

  {listadoMateriales.length === 0 ? (
    <p className="rounded-xl border border-white/20 p-5 text-sm text-white/70">
      Todavía no ha agregado materiales.
    </p>
  ) : (
    <div className="overflow-x-auto rounded-xl border border-white/20">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          Materiales que se enviarán en esta solicitud
        </caption>

        <thead className="bg-black/15">
          <tr>
            <th scope="col" className="px-4 py-3">
              Material
            </th>
            <th scope="col" className="px-4 py-3">
              Tipo
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Cantidad
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Acción
            </th>
          </tr>
        </thead>

        <tbody>
          {listadoMateriales.map((material) => (
            <tr
              key={material.id_material}
              className="border-t border-white/15"
            >
              <td className="px-4 py-3">
                <p className="font-medium">{material.nombre}</p>
                <p className="mt-1 text-xs text-white/65">
                  {material.codigo}
                </p>
              </td>

              <td className="px-4 py-3">
                {material.tipo}
              </td>

              <td className="px-4 py-3 text-right">
                {material.cantidad}
              </td>

              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => quitarMaterial(material.id_material)}
                  aria-label={`Quitar ${material.nombre} del listado`}
                  className="
                    rounded-lg border border-red-200/40
                    px-3 py-2 text-red-100
                    hover:bg-red-200/10
                  "
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
            </fieldset>

            {!materiales.length && central && (
              <p className="mt-5 text-sm text-[#e2edcd]">
                No hay materiales disponibles en el listado de la central.
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-100 p-4 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrar}
                disabled={enviando}
                className="
                  rounded-xl border border-white/40 px-5 py-3
                  text-sm disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  enviando ||
                  !central ||
                  !bodegaSolicitante ||
                  materiales.length === 0
                }
                className="
                  rounded-xl bg-[#b5d58f] px-7 py-3 font-semibold
                  text-[#173d30] hover:bg-[#c5dfa9]
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}