// Conecta Backend
// H-05.3: consulta, aprobación y rechazo de solicitudes de materiales.

const API_URL = "http://127.0.0.1:8000";

// lista las solicitudes según el rol del usuario
export async function obtenerSolicitudes(estado, token) {
  const parametros = estado ? `?estado=${encodeURIComponent(estado)}` : "";

  const respuesta = await fetch(`${API_URL}/solicitudes/${parametros}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudieron obtener las solicitudes"
    );
  }

  return datos;
}


export async function aprobarSolicitud(idSolicitud, token) {
  const respuesta = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/aprobar`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo aprobar la solicitud"
    );
  }

  return datos;
}


export async function rechazarSolicitud(idSolicitud, motivo, token) {
  const respuesta = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/rechazar`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ motivo }),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo rechazar la solicitud"
    );
  }

  return datos;
}