// @vitest-environment node
import { describe, expect, it } from "vitest";

import { registrarEntrada } from "@/services/entradaService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("entradaService.registrarEntrada", () => {
  it("convierte los ids y la cantidad a número antes de enviar", async () => {
    const fetchMock = simularFetch(200, { id_movimiento: 30 });

    await registrarEntrada("2", "5", "1", "3", "Compra", "tok");

    const { url, opciones, body } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/movimientos/entrada`);
    expect(opciones.method).toBe("POST");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(body).toEqual({
      id_material: 2,
      cantidad: 5,
      id_bodega: 1,
      id_proveedor: 3,
      observacion: "Compra",
    });
  });

  it("manda observación vacía cuando no se indica", async () => {
    const fetchMock = simularFetch(200, {});

    await registrarEntrada(2, 5, 1, 3, undefined, "tok");

    expect(llamada(fetchMock).body.observacion).toBe("");
  });

  it("devuelve la respuesta del backend", async () => {
    simularFetch(200, { id_movimiento: 30, cantidad_actual: 25 });

    await expect(registrarEntrada(2, 5, 1, 3, "", "tok")).resolves.toEqual({
      id_movimiento: 30,
      cantidad_actual: 25,
    });
  });

  it("lanza el detalle del backend cuando falla", async () => {
    simularFetch(400, { detail: "El proveedor no existe." });

    await expect(registrarEntrada(2, 5, 1, 99, "", "tok")).rejects.toThrow(
      "El proveedor no existe."
    );
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(registrarEntrada(2, 5, 1, 3, "", "tok")).rejects.toThrow(
      "No se pudo registrar la entrada de materiales"
    );
  });
});
