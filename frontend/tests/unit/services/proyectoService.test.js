// @vitest-environment node
import { describe, expect, it } from "vitest";

import { obtenerProyectosActivos } from "@/services/proyectoService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("proyectoService.obtenerProyectosActivos", () => {
  it("consulta /proyectos/activos con el token", async () => {
    const fetchMock = simularFetch(200, [{ id_proyecto: 1 }]);

    const datos = await obtenerProyectosActivos("tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/proyectos/activos`);
    expect(opciones.method).toBe("GET");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(datos).toEqual([{ id_proyecto: 1 }]);
  });

  it("lanza el detalle del backend cuando falla", async () => {
    simularFetch(401, { detail: "Token inválido o expirado" });

    await expect(obtenerProyectosActivos("malo")).rejects.toThrow(
      "Token inválido o expirado"
    );
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(obtenerProyectosActivos("tok")).rejects.toThrow(
      "No se pudieron obtener los proyectos activos"
    );
  });
});
