// @vitest-environment node
import { describe, expect, it } from "vitest";

import { registrarSalida } from "@/services/salidaService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("salidaService.registrarSalida", () => {
  it("envía la salida a /salidas/ con valores numéricos", async () => {
    const fetchMock = simularFetch(200, { numero_vale: "VALE-2026-001" });

    await registrarSalida("2", "3", "1", "4", "Para columnas", "tok");

    const { url, opciones, body } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/salidas/`);
    expect(opciones.method).toBe("POST");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(body).toEqual({
      id_material: 2,
      cantidad: 3,
      id_bodega_origen: 1,
      id_proyecto: 4,
      observacion: "Para columnas",
    });
  });

  it("manda observación vacía cuando no se indica", async () => {
    const fetchMock = simularFetch(200, {});

    await registrarSalida(2, 3, 1, 4, null, "tok");

    expect(llamada(fetchMock).body.observacion).toBe("");
  });

  it("devuelve el vale generado", async () => {
    simularFetch(200, { numero_vale: "VALE-2026-007" });

    await expect(registrarSalida(2, 3, 1, 4, "", "tok")).resolves.toEqual({
      numero_vale: "VALE-2026-007",
    });
  });

  it("lanza el detalle del backend (por ejemplo, sin stock)", async () => {
    simularFetch(400, {
      detail: "La cantidad de salida supera el inventario disponible.",
    });

    await expect(registrarSalida(2, 999, 1, 4, "", "tok")).rejects.toThrow(
      "supera el inventario disponible"
    );
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(registrarSalida(2, 3, 1, 4, "", "tok")).rejects.toThrow(
      "No se pudo emitir el vale de materiales"
    );
  });
});
