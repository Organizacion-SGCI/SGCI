const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function obtenerContextos(idUsuario) {
  const respuesta = await fetch(
    `${API_URL}/contextos/${idUsuario}`
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error("No se pudieron obtener los contextos");
  }

  return datos;
}