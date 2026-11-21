// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtenerPermisos } from "@/services/permisoService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("permisoService.obtenerPermisos", () => {
  it("consulta /permisos/{idUsuario}", async () => {
    const datos = { id_usuario: 1, rol: "Encargado", permisos: ["ver_inventario"] };
    const fetchMock = simularFetch(200, datos);

    await expect(obtenerPermisos(1)).resolves.toEqual(datos);
    expect(llamada(fetchMock).url).toBe(`${API_URL}/permisos/1`);
  });

  it("lanza un error si el usuario no existe", async () => {
    simularFetch(404, { detail: "Usuario no encontrado" });

    await expect(obtenerPermisos(999)).rejects.toThrow(
      "No se pudieron obtener los permisos"
    );
  });
});
