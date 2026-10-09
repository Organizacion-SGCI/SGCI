const API_URL = "http://127.0.0.1:8000";

export async function obtenerInventario(idBodega, token) {
  const respuesta = await fetch(`${API_URL}/inventario/${idBodega}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo obtener el inventario"
    );
  }

  return datos;
}