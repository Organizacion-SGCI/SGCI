// Capa de comunicación con el backend para el reporte de inventario actual
// H-15.3: consume GET /reportes/inventario (H-15.1)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// El reporte se pide para la bodega o el proyecto del contexto seleccionado
export async function obtenerReporteInventario({ contexto, filtros, token }) {
  const esBodega = contexto?.tipo_contexto === "BODEGA";

  const parametros = new URLSearchParams({
    [esBodega ? "id_bodega" : "id_proyecto"]: String(
      esBodega ? contexto.id_bodega : contexto.id_proyecto
    ),
  });

  if (filtros.material?.trim()) {
    parametros.set("material", filtros.material.trim());
  }

  if (filtros.estado) {
    parametros.set("estado", filtros.estado);
  }

  const respuesta = await fetch(
    `${API_URL}/reportes/inventario?${parametros.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.detail || "No se pudo generar el reporte de inventario"
    );
  }

  return datos;
}