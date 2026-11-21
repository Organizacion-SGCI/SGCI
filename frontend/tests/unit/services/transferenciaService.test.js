// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  confirmarTransferencia,
  consultarExistenciasTransferencia,
} from "@/services/transferenciaService";
import { API_URL, llamada, respuesta, simularFetch } from "../helpers/fetch";

const SOLICITUD = {
  id_solicitud: 5,
  estado: "APROBADA",
  materiales: [
    { id_material: 10, nombre: "Cemento", cantidad: 4 },
    { id_material: 11, nombre: "Arena", cantidad: 2 },
  ],
};

const INVENTARIO_CENTRAL = {
  id_bodega: 1,
  bodega: "Central",
  materiales: [
    { id_material: 10, cantidad: 20 },
    { id_material: 11, cantidad: 7 },
  ],
};

const INVENTARIO_SATELITE = {
  id_bodega: 2,
  bodega: "Satélite",
  materiales: [{ id_material: 10, cantidad: 3 }],
};

// fetch falso que responde según la bodega pedida en la URL
function simularInventarios(porBodega) {
  const mock = vi.fn(async (url) => {
    const id = Number(url.split("/").pop());
    const datos = porBodega[id];
    return datos instanceof Error
      ? respuesta(500, { detail: datos.message })
      : respuesta(200, datos);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

function consultar(cambios = {}) {
  return consultarExistenciasTransferencia({
    solicitud: SOLICITUD,
    idBodegaSalida: 1,
    idBodegaRecepcion: 2,
    token: "tok",
    ...cambios,
  });
}

describe("transferenciaService.consultarExistenciasTransferencia", () => {
  describe("caso correcto", () => {
    it("consulta ambas bodegas y une las existencias por material", async () => {
      const fetchMock = simularInventarios({ 1: INVENTARIO_CENTRAL, 2: INVENTARIO_SATELITE });

      const resultado = await consultar();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls.map(([url]) => url).sort()).toEqual([
        `${API_URL}/inventario/1`,
        `${API_URL}/inventario/2`,
      ]);

      expect(resultado.bodegaOrigen).toEqual({ id_bodega: 1, nombre: "Central" });
      expect(resultado.bodegaDestino).toEqual({ id_bodega: 2, nombre: "Satélite" });
      expect(resultado.materiales).toEqual([
        { id_material: 10, nombre: "Cemento", cantidad: 4, stock_origen: 20, stock_destino: 3 },
        // Arena no existe en la satélite: su existencia es cero
        { id_material: 11, nombre: "Arena", cantidad: 2, stock_origen: 7, stock_destino: 0 },
      ]);
    });
  });

  describe("validaciones de entrada (no llaman al backend)", () => {
    it.each([
      ["sin token", { token: "" }, "Debe iniciar sesión"],
      ["solicitud sin id", { solicitud: { ...SOLICITUD, id_solicitud: 0 } }, "La solicitud debe tener un ID válido."],
      ["bodega de salida inválida", { idBodegaSalida: "1" }, "La bodega de salida debe tener un ID válido."],
      ["bodega de recepción inválida", { idBodegaRecepcion: -2 }, "La bodega de recepción debe tener un ID válido."],
      ["mismas bodegas", { idBodegaRecepcion: 1 }, "deben ser distintas"],
      ["solicitud no aprobada", { solicitud: { ...SOLICITUD, estado: "PENDIENTE" } }, "Solo se pueden transferir solicitudes aprobadas."],
      ["sin materiales", { solicitud: { ...SOLICITUD, materiales: [] } }, "no tiene materiales"],
      ["materiales no es lista", { solicitud: { ...SOLICITUD, materiales: null } }, "no tiene materiales"],
      [
        "cantidad inválida",
        { solicitud: { ...SOLICITUD, materiales: [{ id_material: 10, nombre: "Cemento", cantidad: 0 }] } },
        "La cantidad de Cemento es inválida.",
      ],
      [
        "cantidad decimal sin nombre",
        { solicitud: { ...SOLICITUD, materiales: [{ id_material: 10, cantidad: 1.5 }] } },
        "La cantidad de un material es inválida.",
      ],
      [
        "material sin id válido",
        { solicitud: { ...SOLICITUD, materiales: [{ id_material: null, cantidad: 1 }] } },
        "El material debe tener un ID válido.",
      ],
      [
        "material repetido",
        {
          solicitud: {
            ...SOLICITUD,
            materiales: [
              { id_material: 10, cantidad: 1 },
              { id_material: 10, cantidad: 2 },
            ],
          },
        },
        "materiales repetidos",
      ],
    ])("%s", async (_caso, cambios, mensaje) => {
      const fetchMock = simularFetch(200, {});

      await expect(consultar(cambios)).rejects.toThrow(mensaje);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("validación del inventario recibido", () => {
    it("propaga el error si falla una consulta (no lo convierte en cero)", async () => {
      simularInventarios({ 1: INVENTARIO_CENTRAL, 2: new Error("Bodega no encontrada") });

      await expect(consultar()).rejects.toThrow("Bodega no encontrada");
    });

    it("rechaza un inventario de otra bodega", async () => {
      simularInventarios({ 1: { ...INVENTARIO_CENTRAL, id_bodega: 9 }, 2: INVENTARIO_SATELITE });

      await expect(consultar()).rejects.toThrow("inventario inválido para la bodega");
    });

    it("rechaza un inventario sin lista de materiales", async () => {
      simularInventarios({ 1: { id_bodega: 1 }, 2: INVENTARIO_SATELITE });

      await expect(consultar()).rejects.toThrow("inventario inválido para la bodega");
    });

    it.each([
      ["negativa", -1],
      ["texto", "5"],
      ["infinita", Infinity],
    ])("rechaza existencias inválidas (%s)", async (_caso, cantidad) => {
      simularInventarios({
        1: { ...INVENTARIO_CENTRAL, materiales: [{ id_material: 10, cantidad }] },
        2: INVENTARIO_SATELITE,
      });

      await expect(consultar()).rejects.toThrow("tiene existencias inválidas");
    });

    it("rechaza un material repetido en el inventario", async () => {
      simularInventarios({
        1: {
          ...INVENTARIO_CENTRAL,
          materiales: [
            { id_material: 10, cantidad: 1 },
            { id_material: 10, cantidad: 2 },
          ],
        },
        2: INVENTARIO_SATELITE,
      });

      await expect(consultar()).rejects.toThrow("registros repetidos");
    });
  });
});

describe("transferenciaService.confirmarTransferencia", () => {
  it("hace POST a /transferencias/ con el id en el body", async () => {
    const fetchMock = simularFetch(200, { id_pedido: 8, estado: "EN_TRANSITO" });

    const datos = await confirmarTransferencia("5", "tok");

    const { url, opciones, body } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/transferencias/`);
    expect(opciones.method).toBe("POST");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
    expect(body).toEqual({ id_solicitud: 5 });
    expect(datos.estado).toBe("EN_TRANSITO");
  });

  it("lanza el detalle del backend (stock insuficiente)", async () => {
    simularFetch(400, { detail: "Stock insuficiente en la bodega de salida: Cemento." });

    await expect(confirmarTransferencia(5, "tok")).rejects.toThrow("Stock insuficiente");
  });

  it("usa un mensaje genérico sin detalle", async () => {
    simularFetch(500, {});

    await expect(confirmarTransferencia(5, "tok")).rejects.toThrow(
      "Error al confirmar la transferencia"
    );
  });
});
