const API_URL = "http://127.0.0.1:8000";

export async function obtener_notificaciones(token) {
  const respuesta = await fetch(`${API_URL}/notificaciones/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    throw new Error("No se pudieron obtener las notificaciones");
  }

  return respuesta.json();
}