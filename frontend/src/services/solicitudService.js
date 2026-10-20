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

// H-03.2: registrar una solicitud de materiales.
export async function crearSolicitud(solicitud, token) {
  const respuesta = await fetch(`${API_URL}/solicitudes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(solicitud),
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const detalle = datos?.detail;

    const mensaje = Array.isArray(detalle)
      ? detalle.map((error) => error.msg).join(". ")
      : typeof detalle === "string"
        ? detalle
        : "No se pudo registrar la solicitud.";

    throw new Error(mensaje);
  }

  if (!datos?.id_solicitud) {
    throw new Error(
      "El servidor no devolvió la confirmación de la solicitud. Revise el listado antes de intentar enviarla nuevamente."
    );
  }

  return datos;
}

// H-03.2: obtener las bodegas para identificar la central.
export async function obtenerBodegas(token) {
  const respuesta = await fetch(`${API_URL}/bodegas/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(
      typeof datos?.detail === "string"
        ? datos.detail
        : "No se pudieron cargar las bodegas."
    );
  }

  if (!Array.isArray(datos)) {
    throw new Error("El servidor devolvió un listado de bodegas inválido.");
  }

  return datos;
}