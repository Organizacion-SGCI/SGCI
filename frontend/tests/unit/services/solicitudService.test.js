// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  aprobarSolicitud,
  confirmarRecepcion,
  crearSolicitud,
  obtenerBodegas,
  obtenerSolicitudes,
  rechazarSolicitud,
} from "@/services/solicitudService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("solicitudService.obtenerSolicitudes", () => {
  it("sin estado consulta /solicitudes/ sin parámetros", async () => {
    const fetchMock = simularFetch(200, []);

    await obtenerSolicitudes(undefined, "tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/solicitudes/`);
    expect(opciones.headers.Authorization).toBe("Bearer tok");
  });

  it("con estado lo agrega codificado a la URL", async () => {
    const fetchMock = simularFetch(200, []);

    await obtenerSolicitudes("EN TRANSITO", "tok");

    expect(llamada(fetchMock).url).toBe(
      `${API_URL}/solicitudes/?estado=EN%20TRANSITO`
    );
  });

  it("lanza el detalle del backend", async () => {
    simularFetch(400, { detail: "El estado indicado no es válido." });

    await expect(obtenerSolicitudes("X", "tok")).rejects.toThrow(
      "El estado indicado no es válido."
    );
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(obtenerSolicitudes(null, "tok")).rejects.toThrow(
      "No se pudieron obtener las solicitudes"
    );
  });
});

describe("solicitudService.aprobarSolicitud", () => {
  it("hace PUT a /solicitudes/{id}/aprobar", async () => {
    const fetchMock = simularFetch(200, { estado: "APROBADA" });

    const datos = await aprobarSolicitud(5, "tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/solicitudes/5/aprobar`);
    expect(opciones.method).toBe("PUT");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(datos).toEqual({ estado: "APROBADA" });
  });

  it("lanza el detalle si ya fue procesada", async () => {
    simularFetch(400, { detail: "La solicitud ya fue procesada" });

    await expect(aprobarSolicitud(5, "tok")).rejects.toThrow("ya fue procesada");
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(aprobarSolicitud(5, "tok")).rejects.toThrow(
      "No se pudo aprobar la solicitud"
    );
  });
});

describe("solicitudService.rechazarSolicitud", () => {
  it("hace PUT a /solicitudes/{id}/rechazar con el motivo", async () => {
    const fetchMock = simularFetch(200, { estado: "RECHAZADA" });

    await rechazarSolicitud(5, "Duplicada", "tok");

    const { url, opciones, body } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/solicitudes/5/rechazar`);
    expect(opciones.method).toBe("PUT");
    expect(opciones.headers["Content-Type"]).toBe("application/json");
    expect(body).toEqual({ motivo: "Duplicada" });
  });

  it("lanza el detalle del backend", async () => {
    simularFetch(403, { detail: "No tiene permiso para realizar esta acción" });

    await expect(rechazarSolicitud(5, "", "tok")).rejects.toThrow("No tiene permiso");
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(rechazarSolicitud(5, "", "tok")).rejects.toThrow(
      "No se pudo rechazar la solicitud"
    );
  });
});

describe("solicitudService.crearSolicitud", () => {
  const SOLICITUD = {
    id_bodega_origen: 2,
    id_bodega_destino: 1,
    prioridad: "ALTA",
    materiales: [{ id_material: 10, cantidad: 5 }],
  };

  it("envía la solicitud por POST y devuelve la confirmación", async () => {
    const fetchMock = simularFetch(200, { id_solicitud: 50, estado: "PENDIENTE" });

    const datos = await crearSolicitud(SOLICITUD, "tok");

    const { url, opciones, body } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/solicitudes/`);
    expect(opciones.method).toBe("POST");
    expect(body).toEqual(SOLICITUD);
    expect(datos.id_solicitud).toBe(50);
  });

  it("une los mensajes de validación de FastAPI (422)", async () => {
    simularFetch(422, {
      detail: [
        { msg: "Input should be greater than 0" },
        { msg: "Field required" },
      ],
    });

    await expect(crearSolicitud(SOLICITUD, "tok")).rejects.toThrow(
      "Input should be greater than 0. Field required"
    );
  });

  it("usa el detalle de texto del backend", async () => {
    simularFetch(400, { detail: "La bodega de origen debe ser distinta a la de destino." });

    await expect(crearSolicitud(SOLICITUD, "tok")).rejects.toThrow(
      "La bodega de origen debe ser distinta"
    );
  });

  it("usa un mensaje genérico si la respuesta no es JSON", async () => {
    simularFetch(500, new SyntaxError("Unexpected token"));

    await expect(crearSolicitud(SOLICITUD, "tok")).rejects.toThrow(
      "No se pudo registrar la solicitud."
    );
  });

  it("avisa si el backend no devolvió el id de la solicitud", async () => {
    simularFetch(200, { estado: "PENDIENTE" });

    await expect(crearSolicitud(SOLICITUD, "tok")).rejects.toThrow(
      "no devolvió la confirmación"
    );
  });
});

describe("solicitudService.obtenerBodegas", () => {
  it("devuelve la lista de bodegas", async () => {
    const bodegas = [{ id_bodega: 1, tipo: "CENTRAL" }];
    const fetchMock = simularFetch(200, bodegas);

    await expect(obtenerBodegas("tok")).resolves.toEqual(bodegas);
    expect(llamada(fetchMock).url).toBe(`${API_URL}/bodegas/`);
  });

  it("rechaza una respuesta que no es lista", async () => {
    simularFetch(200, { bodegas: [] });

    await expect(obtenerBodegas("tok")).rejects.toThrow(
      "listado de bodegas inválido"
    );
  });

  it("usa el detalle de texto del backend cuando falla", async () => {
    simularFetch(401, { detail: "Token inválido o expirado" });

    await expect(obtenerBodegas("tok")).rejects.toThrow("Token inválido o expirado");
  });

  it("usa un mensaje genérico si el detalle no es texto o no hay JSON", async () => {
    simularFetch(500, new SyntaxError("Unexpected token"));

    await expect(obtenerBodegas("tok")).rejects.toThrow(
      "No se pudieron cargar las bodegas."
    );
  });
});

describe("solicitudService.confirmarRecepcion", () => {
  it("hace PUT a /solicitudes/{id}/recibir", async () => {
    const fetchMock = simularFetch(200, { mensaje: "ok" });

    await confirmarRecepcion(5, "tok");

    const { url, opciones } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/solicitudes/5/recibir`);
    expect(opciones.method).toBe("PUT");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
  });

  it("lanza el detalle del backend", async () => {
    simularFetch(400, { detail: "La solicitud no está en tránsito, no se puede recibir." });

    await expect(confirmarRecepcion(5, "tok")).rejects.toThrow("no está en tránsito");
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(confirmarRecepcion(5, "tok")).rejects.toThrow(
      "Error al confirmar la recepción"
    );
  });
});
