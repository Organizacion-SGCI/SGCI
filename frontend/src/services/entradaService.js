const API_URL = "http://127.0.0.1:8000";

export async function registrarEntrada(
  idMaterial,
  cantidad,
  idBodega,
  idProveedor,
  observacion,
  token
) {
  const respuesta = await fetch(`${API_URL}/movimientos/entrada`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id_material: Number(idMaterial),
      cantidad: Number(cantidad),
      id_bodega: Number(idBodega),
      id_proveedor: Number(idProveedor),
      observacion: observacion || "",
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo registrar la entrada de materiales"
    );
  }

  return datos;
}