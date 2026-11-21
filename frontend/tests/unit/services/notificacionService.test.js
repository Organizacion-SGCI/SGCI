// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtener_notificaciones } from "@/services/notificacionService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("notificacionService.obtener_notificaciones", () => {
  it("consulta /notificaciones/ con el token", async () => {
    const fetchMock = simularFetch(200, [{ id_notificacion: 1 }]);

    const datos = await obtener_notificaciones("tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/notificaciones/`);
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(datos).toEqual([{ id_notificacion: 1 }]);
  });

  it("lanza un error si la respuesta no es correcta", async () => {
    simularFetch(401, { detail: "Token inválido o expirado" });

    await expect(obtener_notificaciones("malo")).rejects.toThrow(
      "No se pudieron obtener las notificaciones"
    );
  });
});
