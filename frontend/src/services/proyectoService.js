
// Capa de comunicación con el backend para el módulo de proyectos.

const API_URL = "http://127.0.0.1:8000";

export async function obtenerProyectosActivos(token) {
  const respuesta = await fetch(`${API_URL}/proyectos/activos`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudieron obtener los proyectos activos"
    );
  }

  return datos;
}