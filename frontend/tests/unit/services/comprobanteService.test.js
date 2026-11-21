// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtenerComprobanteIngreso } from "@/services/comprobanteService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("comprobanteService.obtenerComprobanteIngreso", () => {
  it("consulta /ingresos/{id} con el token", async () => {
    const fetchMock = simularFetch(200, { id_movimiento: 15 });

    const datos = await obtenerComprobanteIngreso(15, "tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/ingresos/15`);
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(datos).toEqual({ id_movimiento: 15 });
  });

  it("lanza el detalle del backend si no existe el ingreso", async () => {
    simularFetch(404, { detail: "Registro de ingreso no encontrado" });

    await expect(obtenerComprobanteIngreso(999, "tok")).rejects.toThrow(
      "Registro de ingreso no encontrado"
    );
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(obtenerComprobanteIngreso(1, "tok")).rejects.toThrow(
      "No se pudo obtener el comprobante de ingreso"
    );
  });
});
