
// Se encarga únicamente de hacer la petición HTTP al endpoint
// y devolver la respuesta en formato JSON porque no entiende de react.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function obtenerPermisos(idUsuario) {
  const response = await fetch(`${API_URL}/permisos/${idUsuario}`);

  if (!response.ok) {
    throw new Error("No se pudieron obtener los permisos");
  }

  return response.json();
}