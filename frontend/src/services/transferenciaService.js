import { obtenerInventario } from "@/services/inventarioService";

// H-10.2: consulta las existencias para revisar una transferencia.
// Estos IDs representan el movimiento físico de los materiales:
// bodegaSalida -> bodegaRecepcion.

function validarId(valor, nombre) {
  if (!Number.isSafeInteger(valor) || valor <= 0) {
    throw new Error(`${nombre} debe tener un ID válido.`);
  }
}

function validarInventario(inventario, idBodega) {
  if (
    !inventario ||
    inventario.id_bodega !== idBodega ||
    !Array.isArray(inventario.materiales)
  ) {
    throw new Error(
      "El servidor devolvió un inventario inválido para la bodega."
    );
  }

  const existencias = new Map();

  for (const material of inventario.materiales) {
    validarId(material.id_material, "El material");

    if (
      typeof material.cantidad !== "number" ||
      !Number.isFinite(material.cantidad) ||
      material.cantidad < 0
    ) {
      throw new Error(
        `El material #${material.id_material} tiene existencias inválidas.`
      );
    }

    if (existencias.has(material.id_material)) {
      throw new Error(
        "El inventario contiene registros repetidos de un material."
      );
    }

    existencias.set(material.id_material, material);
  }

  return existencias;
}

export async function consultarExistenciasTransferencia({
  solicitud,
  idBodegaSalida,
  idBodegaRecepcion,
  token,
}) {
  if (!token) {
    throw new Error("Debe iniciar sesión para consultar existencias.");
  }

  validarId(solicitud?.id_solicitud, "La solicitud");
  validarId(idBodegaSalida, "La bodega de salida");
  validarId(idBodegaRecepcion, "La bodega de recepción");

  if (idBodegaSalida === idBodegaRecepcion) {
    throw new Error("Las bodegas de salida y recepción deben ser distintas.");
  }

  if (solicitud.estado !== "APROBADA") {
    throw new Error("Solo se pueden transferir solicitudes aprobadas.");
  }

  if (
    !Array.isArray(solicitud.materiales) ||
    solicitud.materiales.length === 0
  ) {
    throw new Error("La solicitud no tiene materiales para transferir.");
  }

  const ids = new Set();

  for (const material of solicitud.materiales) {
    validarId(material.id_material, "El material");

    if (
      !Number.isSafeInteger(material.cantidad) ||
      material.cantidad <= 0
    ) {
      throw new Error(
        `La cantidad de ${material.nombre || "un material"} es inválida.`
      );
    }

    if (ids.has(material.id_material)) {
      throw new Error("La solicitud contiene materiales repetidos.");
    }

    ids.add(material.id_material);
  }

  // Ambas consultas son de lectura y pueden ejecutarse en paralelo.
  const [inventarioSalida, inventarioRecepcion] = await Promise.all([
    obtenerInventario(idBodegaSalida, token),
    obtenerInventario(idBodegaRecepcion, token),
  ]);

  const stockSalida = validarInventario(
    inventarioSalida,
    idBodegaSalida
  );

  const stockRecepcion = validarInventario(
    inventarioRecepcion,
    idBodegaRecepcion
  );

  const materiales = solicitud.materiales.map((material) => {
    const origen = stockSalida.get(material.id_material);
    const destino = stockRecepcion.get(material.id_material);

    return {
      ...material,

      // La consulta devuelve todo el inventario de la bodega.
      // Si un material no tiene registro, sus existencias son cero.
      // Un fallo de consulta lanza un error; no se convierte en cero.
      stock_origen: origen?.cantidad ?? 0,
      stock_destino: destino?.cantidad ?? 0,
    };
  });

  return {
    bodegaOrigen: {
      id_bodega: idBodegaSalida,
      nombre: inventarioSalida.bodega,
    },
    bodegaDestino: {
      id_bodega: idBodegaRecepcion,
      nombre: inventarioRecepcion.bodega,
    },
    materiales,
  };
}