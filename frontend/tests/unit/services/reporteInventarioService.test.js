// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtenerReporteInventario } from "@/services/reporteInventarioService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

function parametrosDe(url) {
  return Object.fromEntries(new URL(url).searchParams);
}

describe("reporteInventarioService.obtenerReporteInventario", () => {
  it("pide el reporte de la bodega del contexto", async () => {
    const fetchMock = simularFetch(200, { materiales: [] });

    await obtenerReporteInventario({
      contexto: { tipo_contexto: "BODEGA", id_bodega: 1 },
      filtros: {},
      token: "tok",
    });

    const { url, opciones } = llamada(fetchMock);
    expect(url.startsWith(`${API_URL}/reportes/inventario?`)).toBe(true);
    expect(parametrosDe(url)).toEqual({ id_bodega: "1" });
    expect(opciones.headers.Authorization).toBe("Bearer tok");
  });

  it("pide el reporte del proyecto del contexto", async () => {
    const fetchMock = simularFetch(200, { materiales: [] });

    await obtenerReporteInventario({
      contexto: { tipo_contexto: "PROYECTO", id_proyecto: 7 },
      filtros: {},
      token: "tok",
    });

    expect(parametrosDe(llamada(fetchMock).url)).toEqual({ id_proyecto: "7" });
  });

  it("agrega los filtros de material (sin espacios) y estado", async () => {
    const fetchMock = simularFetch(200, { materiales: [] });

    await obtenerReporteInventario({
      contexto: { tipo_contexto: "BODEGA", id_bodega: 1 },
      filtros: { material: "  cemento ", estado: "STOCK_BAJO" },
      token: "tok",
    });

    expect(parametrosDe(llamada(fetchMock).url)).toEqual({
      id_bodega: "1",
      material: "cemento",
      estado: "STOCK_BAJO",
    });
  });

  it("ignora un filtro de material con solo espacios", async () => {
    const fetchMock = simularFetch(200, { materiales: [] });

    await obtenerReporteInventario({
      contexto: { tipo_contexto: "BODEGA", id_bodega: 1 },
      filtros: { material: "   " },
      token: "tok",
    });

    expect(parametrosDe(llamada(fetchMock).url)).not.toHaveProperty("material");
  });

  it("lanza el detalle del backend cuando no hay acceso", async () => {
    simularFetch(403, { detail: "No tiene acceso a la bodega o proyecto indicado." });

    await expect(
      obtenerReporteInventario({
        contexto: { tipo_contexto: "BODEGA", id_bodega: 1 },
        filtros: {},
        token: "tok",
      })
    ).rejects.toThrow("No tiene acceso");
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(
      obtenerReporteInventario({
        contexto: { tipo_contexto: "BODEGA", id_bodega: 1 },
        filtros: {},
        token: "tok",
      })
    ).rejects.toThrow("No se pudo generar el reporte de inventario");
  });
});
