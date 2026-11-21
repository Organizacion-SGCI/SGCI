// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtenerInventario } from "@/services/inventarioService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("inventarioService.obtenerInventario", () => {
  it("consulta /inventario/{idBodega} por GET con el token", async () => {
    const fetchMock = simularFetch(200, { id_bodega: 1, materiales: [] });

    const datos = await obtenerInventario(1, "tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/inventario/1`);
    expect(opciones.method).toBe("GET");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(datos).toEqual({ id_bodega: 1, materiales: [] });
  });

  it("lanza el detalle del backend si la bodega no existe", async () => {
    simularFetch(404, { detail: "Bodega no encontrada" });

    await expect(obtenerInventario(999, "tok")).rejects.toThrow(
      "Bodega no encontrada"
    );
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(obtenerInventario(1, "tok")).rejects.toThrow(
      "No se pudo obtener el inventario"
    );
  });
});
