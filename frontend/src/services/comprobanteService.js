const API_URL = "http://127.0.0.1:8000";

// H-08.2: consulta el comprobante de un ingreso (endpoint H-08.1)
export async function obtenerComprobanteIngreso(idMovimiento, token) {
  const respuesta = await fetch(`${API_URL}/ingresos/${idMovimiento}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo obtener el comprobante de ingreso"
    );
  }

  return datos;
}