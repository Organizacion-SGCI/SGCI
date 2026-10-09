
// Capa de comunicación con el backend para el módulo de salida.

const API_URL = "http://127.0.0.1:8000";

export async function registrarSalida(
  idMaterial,
  cantidad,
  idBodegaOrigen,
  idProyecto,
  observacion,
  token
) {
  const respuesta = await fetch(`${API_URL}/salidas/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id_material: Number(idMaterial),
      cantidad: Number(cantidad),
      id_bodega_origen: Number(idBodegaOrigen),
      id_proyecto: Number(idProyecto),
      observacion: observacion || "",
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo emitir el vale de materiales"
    );
  }

  return datos;
}