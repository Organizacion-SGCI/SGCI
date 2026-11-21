// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { consultarMovimientos } from "@/services/reporteService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

const BODEGA = { tipo_contexto: "BODEGA", id_bodega: 1 };
const PROYECTO = { tipo_contexto: "PROYECTO", id_proyecto: 7 };

function parametrosDe(url) {
  return Object.fromEntries(new URL(url).searchParams);
}

describe("reporteService.consultarMovimientos", () => {
  describe("validaciones antes de llamar al backend", () => {
    it("exige token", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await expect(
        consultarMovimientos({ contexto: BODEGA, filtros: {}, token: "" })
      ).rejects.toThrow("La sesión no está disponible");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
      ["sin contexto", undefined],
      ["tipo desconocido", { tipo_contexto: "OTRO", id_bodega: 1 }],
      ["id cero", { tipo_contexto: "BODEGA", id_bodega: 0 }],
      ["id negativo", { tipo_contexto: "PROYECTO", id_proyecto: -3 }],
      ["id decimal", { tipo_contexto: "BODEGA", id_bodega: 1.5 }],
      ["id que no es número", { tipo_contexto: "BODEGA", id_bodega: "abc" }],
    ])("rechaza un contexto inválido (%s)", async (_caso, contexto) => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await expect(
        consultarMovimientos({ contexto, filtros: {}, token: "tok" })
      ).rejects.toThrow("Seleccione una bodega o proyecto válido.");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rechaza una fecha inicial mayor que la final", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await expect(
        consultarMovimientos({
          contexto: BODEGA,
          filtros: { fecha_desde: "2026-12-01", fecha_hasta: "2026-11-01" },
          token: "tok",
        })
      ).rejects.toThrow("La fecha inicial no puede superar la fecha final.");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("armado de la consulta", () => {
    it("usa id_bodega para una bodega y manda el token", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await consultarMovimientos({ contexto: BODEGA, filtros: {}, token: "tok" });

      const { url, opciones } = llamada(fetchMock);
      expect(url.startsWith(`${API_URL}/reportes/movimientos?`)).toBe(true);
      expect(parametrosDe(url)).toEqual({ id_bodega: "1" });
      expect(opciones.headers.Authorization).toBe("Bearer tok");
      expect(opciones.cache).toBe("no-store");
    });

    it("usa id_proyecto para un proyecto", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await consultarMovimientos({ contexto: PROYECTO, filtros: {}, token: "tok" });

      expect(parametrosDe(llamada(fetchMock).url)).toEqual({ id_proyecto: "7" });
    });

    it("acepta el id como texto numérico", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await consultarMovimientos({
        contexto: { tipo_contexto: "BODEGA", id_bodega: "4" },
        filtros: {},
        token: "tok",
      });

      expect(parametrosDe(llamada(fetchMock).url)).toEqual({ id_bodega: "4" });
    });

    it("incluye solo los filtros con valor y sin espacios", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await consultarMovimientos({
        contexto: BODEGA,
        filtros: {
          fecha_desde: "2026-11-01",
          fecha_hasta: "2026-11-30",
          tipo: "SALIDA",
          material: "  cemento  ",
          otro_campo: "se ignora",
        },
        token: "tok",
      });

      expect(parametrosDe(llamada(fetchMock).url)).toEqual({
        id_bodega: "1",
        fecha_desde: "2026-11-01",
        fecha_hasta: "2026-11-30",
        tipo: "SALIDA",
        material: "cemento",
      });
    });

    it("omite filtros vacíos o con solo espacios", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });

      await consultarMovimientos({
        contexto: BODEGA,
        filtros: { tipo: "", material: "   " },
        token: "tok",
      });

      expect(parametrosDe(llamada(fetchMock).url)).toEqual({ id_bodega: "1" });
    });

    it("pasa la señal para poder cancelar la consulta", async () => {
      const fetchMock = simularFetch(200, { movimientos: [] });
      const controlador = new AbortController();

      await consultarMovimientos({
        contexto: BODEGA,
        filtros: {},
        token: "tok",
        signal: controlador.signal,
      });

      expect(llamada(fetchMock).opciones.signal).toBe(controlador.signal);
    });
  });

  describe("respuesta del backend", () => {
    it("devuelve los movimientos", async () => {
      const movimientos = [{ id_movimiento: 1 }, { id_movimiento: 2 }];
      simularFetch(200, { movimientos });

      await expect(
        consultarMovimientos({ contexto: BODEGA, filtros: {}, token: "tok" })
      ).resolves.toEqual({ pendienteIntegracion: false, movimientos });
    });

    it("devuelve lista vacía si no hay coincidencias", async () => {
      simularFetch(200, { movimientos: [] });

      const resultado = await consultarMovimientos({
        contexto: BODEGA,
        filtros: {},
        token: "tok",
      });

      expect(resultado.movimientos).toEqual([]);
    });

    it.each([
      [401, "La sesión expiró"],
      [403, "No tiene permiso para consultar este reporte."],
      [500, "No se pudo consultar el historial"],
      [400, "No se pudo consultar el historial"],
    ])("traduce el error HTTP %i", async (status, mensaje) => {
      simularFetch(status, { detail: "x" });

      await expect(
        consultarMovimientos({ contexto: BODEGA, filtros: {}, token: "tok" })
      ).rejects.toThrow(mensaje);
    });

    it.each([
      ["sin movimientos", {}],
      ["movimientos no es lista", { movimientos: "nada" }],
    ])("rechaza un formato inesperado (%s)", async (_caso, cuerpo) => {
      simularFetch(200, cuerpo);

      await expect(
        consultarMovimientos({ contexto: BODEGA, filtros: {}, token: "tok" })
      ).rejects.toThrow("formato de reporte inesperado");
    });

    it("propaga el error si la red falla", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

      await expect(
        consultarMovimientos({ contexto: BODEGA, filtros: {}, token: "tok" })
      ).rejects.toThrow("Failed to fetch");
    });
  });
});
