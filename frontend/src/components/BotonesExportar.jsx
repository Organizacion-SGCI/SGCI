"use client";

import { useState } from "react";
import { exportarExcel, exportarPDF } from "@/utils/exportarReporte";

// H-15.3: botones para exportar un reporte a Excel o PDF.
// Se usa en cualquier pantalla de reportes pasándole los datos ya consultados:
//   titulo   columnas   filas   filtros   nombreArchivo 
export default function BotonesExportar({
  titulo,
  columnas,
  filas,
  filtros = [],
  nombreArchivo,
}) {
  const [exportando, setExportando] = useState("");
  const [error, setError] = useState("");

  const sinDatos = !filas || filas.length === 0;

  const exportar = async (formato) => {
    try {
      setError("");
      setExportando(formato);

      const opciones = { titulo, columnas, filas, filtros, nombreArchivo };

      if (formato === "excel") {
        await exportarExcel(opciones);
      } else {
        await exportarPDF(opciones);
      }
    } catch (error) {
      console.error("Error al exportar el reporte:", error);
      setError("No se pudo generar el archivo. Intente nuevamente.");
    } finally {
      setExportando("");
    }
  };

  const claseBoton =
    "cursor-pointer rounded-xl border border-[#145c42] px-5 py-3 font-semibold " +
    "text-[#145c42] transition hover:bg-[#dcefd7] " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div>

      <div className="flex flex-wrap gap-3">

        <button
          type="button"
          onClick={() => exportar("excel")}
          disabled={sinDatos || exportando !== ""}
          className={claseBoton}
        >
          {exportando === "excel" ? "Generando Excel..." : "Exportar a Excel"}
        </button>

        <button
          type="button"
          onClick={() => exportar("pdf")}
          disabled={sinDatos || exportando !== ""}
          className={claseBoton}
        >
          {exportando === "pdf" ? "Generando PDF..." : "Exportar a PDF"}
        </button>

      </div>

      {sinDatos && (
        <p className="mt-2 text-sm text-gray-500">
          No hay datos para exportar.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}