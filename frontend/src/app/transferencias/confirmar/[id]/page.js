"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Guard from "@/components/Guard";
import ConfirmacionTransferencia from "@/components/ConfirmacionTransferencia";

import { obtenerSolicitudes } from "@/services/solicitudService";
import {
  consultarExistenciasTransferencia,
} from "@/services/transferenciaService";

// Guard impide montar el contenido y consultar datos
// mientras no se haya verificado el permiso.
export default function PaginaConfirmarTransferencia() {
  return (
    <Guard
      permiso="transferir_material"
      fallback={
        <main className="min-h-screen bg-[#f7f8f3] p-10 text-[#173d30]">
          No tiene permiso para transferir materiales.
        </main>
      }
    >
      <ContenidoConfirmacion />
    </Guard>
  );
}

function ContenidoConfirmacion() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [usuario, setUsuario] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");
      setDatos(null);

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          router.replace("/");
          return;
        }

        const usuarioActual = JSON.parse(
          sessionStorage.getItem("usuario") || "null"
        );

        const contexto = JSON.parse(
          sessionStorage.getItem("contexto") || "null"
        );

        if (!usuarioActual) {
          router.replace("/");
          return;
        }

        if (
          !Number.isSafeInteger(contexto?.id_bodega) ||
          contexto.id_bodega <= 0
        ) {
          router.replace("/contexto");
          return;
        }

        if (activo) setUsuario(usuarioActual);

        if (
          typeof id !== "string" ||
          !/^[1-9]\d*$/.test(id) ||
          !Number.isSafeInteger(Number(id))
        ) {
          throw new Error("El número de solicitud es inválido.");
        }

        const solicitudes = await obtenerSolicitudes(
          "APROBADA",
          token
        );

        if (!Array.isArray(solicitudes)) {
          throw new Error(
            "El servidor devolvió un listado de solicitudes inválido."
          );
        }

        const solicitud = solicitudes.find(
          (item) => Number(item.id_solicitud) === Number(id)
        );

        if (!solicitud || solicitud.estado !== "APROBADA") {
          throw new Error(
            "La solicitud no está aprobada o no está disponible para su usuario."
          );
        }

        // En el modelo actual:
        // origen de solicitud = satélite que pide.
        // destino de solicitud = central a la que se pide.
        //
        // El movimiento físico es en sentido contrario:
        // central -> satélite.
        const idBodegaSalida = solicitud.id_bodega_destino;
        const idBodegaRecepcion = solicitud.id_bodega_origen;

        if (
          !Number.isSafeInteger(idBodegaSalida) ||
          !Number.isSafeInteger(idBodegaRecepcion) ||
          idBodegaSalida <= 0 ||
          idBodegaRecepcion <= 0
        ) {
          throw new Error(
            "La solicitud no incluye IDs válidos para ambas bodegas."
          );
        }

        if (contexto.id_bodega !== idBodegaSalida) {
          throw new Error(
            "Seleccione como contexto la bodega de salida para revisar esta transferencia."
          );
        }

        const existencias = await consultarExistenciasTransferencia({
          solicitud,
          idBodegaSalida,
          idBodegaRecepcion,
          token,
        });

        if (!activo) return;

        setDatos({
          solicitud,
          ...existencias,
        });
      } catch (error) {
        if (activo) {
          setError(
            error.message || "No se pudo cargar la transferencia."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [id, router, recarga]);

  return (
    <main className="min-h-screen bg-[#f7f8f3]">
      <Header usuario={usuario} titulo="Transferencias" />

      <Sidebar usuario={usuario} activo="transferencias" />

      <section className="min-h-screen pb-12 pl-[270px] pr-10 pt-[120px]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[#173d30]">
              Revisión de transferencia
            </h1>

            <p className="mt-2 text-gray-500">
              Compruebe las existencias antes de enviar los materiales.
            </p>
          </div>

          {cargando && (
            <p role="status" className="text-[#145c42]">
              Cargando solicitud e inventarios...
            </p>
          )}

          {!cargando && error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
            >
              <p>{error}</p>
            </div>
          )}

          {!cargando && datos && (
            <>
              <p
                role="status"
                className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                La confirmación de transferencias todavía no está
                disponible. Puede consultar las existencias actuales.
              </p>

              <ConfirmacionTransferencia
                solicitud={datos.solicitud}
                bodegaOrigen={datos.bodegaOrigen}
                bodegaDestino={datos.bodegaDestino}
                materiales={datos.materiales}
                onCancelar={() => router.push("/solicitudes")}
              />
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={cargando}
              onClick={() => setRecarga((valor) => valor + 1)}
              className="rounded-xl bg-[#145c42] px-5 py-3 font-semibold text-white hover:bg-[#0f4934] disabled:opacity-50"
            >
              Actualizar existencias
            </button>

            <button
              type="button"
              onClick={() => router.push("/contexto")}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-600 hover:bg-white"
            >
              Cambiar bodega
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}