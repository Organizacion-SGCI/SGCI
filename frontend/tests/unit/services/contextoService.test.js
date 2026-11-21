// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtenerContextos } from "@/services/contextoService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("contextoService.obtenerContextos", () => {
  it("consulta /contextos/{idUsuario} y devuelve bodegas y proyectos", async () => {
    const datos = { bodegas: [{ id_bodega: 1 }], proyectos: [] };
    const fetchMock = simularFetch(200, datos);

    await expect(obtenerContextos(3)).resolves.toEqual(datos);
    expect(llamada(fetchMock).url).toBe(`${API_URL}/contextos/3`);
  });

  it("lanza un error si la respuesta no es correcta", async () => {
    simularFetch(500, { detail: "fallo" });

    await expect(obtenerContextos(3)).rejects.toThrow(
      "No se pudieron obtener los contextos"
    );
  });
});
