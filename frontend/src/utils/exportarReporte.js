// H-15.3: exportación de reportes a Excel y PDF.

// Funciones reutilizables: reciben el título, las columnas y las filas ya 
// consultadas (con los mismos filtros de la consulta) y generan el archivo en el navegador, sin pasar por el backend

// Devuelve el valor de una celda; si no hay dato, texto vacío
function valorCelda(fila, campo) {
  const valor = fila[campo];

  return valor === null || valor === undefined ? "" : valor;
}

// Fecha y hora en que se genera el archivo
function fechaGeneracion() {
  return new Date().toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function exportarExcel({
  titulo,
  columnas,
  filas,
  filtros = [],
  nombreArchivo,
}) {
  // La librería se carga solo cuando se exporta
  const modulo = await import("xlsx");
  const XLSX = modulo.default ?? modulo;

  // Encabezado del archivo: título, fecha, filtros y fila de columnas
  const encabezado = [
    [titulo],
    [`Generado: ${fechaGeneracion()}`],
    ...filtros.map((filtro) => [filtro]),
    [],
    columnas.map((columna) => columna.titulo),
  ];

  const datos = filas.map((fila) =>
    columnas.map((columna) => valorCelda(fila, columna.campo))
  );

  const hoja = XLSX.utils.aoa_to_sheet([...encabezado, ...datos]);

  // Ancho de cada columna según el texto más largo
  hoja["!cols"] = columnas.map((columna) => {
    const largo = Math.max(
      String(columna.titulo).length,
      ...filas.map((fila) => String(valorCelda(fila, columna.campo)).length)
    );

    return { wch: Math.min(Math.max(largo + 2, 10), 40) };
  });

  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, hoja, "Reporte");
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}

export async function exportarPDF({
  titulo,
  columnas,
  filas,
  filtros = [],
  nombreArchivo,
}) {
  const { jsPDF } = await import("jspdf");
  const modulo = await import("jspdf-autotable");
  const autoTable = modulo.default ?? modulo.autoTable;

  // Si hay muchas columnas el papel en horizontal
  const documento = new jsPDF({
    orientation: columnas.length > 6 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const margen = 40;
  let y = 40;

  // Título, fecha y filtros aplicados
  documento.setFontSize(16);
  documento.setTextColor(20, 92, 66);
  documento.text(titulo, margen, y);

  documento.setFontSize(9);
  documento.setTextColor(90);

  y += 18;
  documento.text(`Generado: ${fechaGeneracion()}`, margen, y);

  for (const filtro of filtros) {
    y += 12;
    documento.text(filtro, margen, y);
  }

  // Tabla con los resultados
  autoTable(documento, {
    startY: y + 14,
    head: [columnas.map((columna) => columna.titulo)],
    body: filas.map((fila) =>
      columnas.map((columna) => String(valorCelda(fila, columna.campo)))
    ),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [20, 92, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 247, 238] },
    margin: { left: margen, right: margen },
  });

  // Número de página en el pie
  const paginas = documento.getNumberOfPages();
  const ancho = documento.internal.pageSize.getWidth();
  const alto = documento.internal.pageSize.getHeight();

  for (let pagina = 1; pagina <= paginas; pagina++) {
    documento.setPage(pagina);
    documento.setFontSize(8);
    documento.setTextColor(120);
    documento.text(`Página ${pagina} de ${paginas}`, ancho - margen, alto - 20, {
      align: "right",
    });
  }

  documento.save(`${nombreArchivo}.pdf`);
}