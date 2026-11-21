// Pruebas de la exportación a Excel y PDF (H-15.3).
// Las librerías xlsx, jspdf y jspdf-autotable se reemplazan por simulaciones:
// no se genera ningún archivo real, solo se revisa qué se le pide a cada una.

import { beforeEach, describe, expect, it, vi } from "vitest";

const simulados = vi.hoisted(() => {
  const documento = {
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    getNumberOfPages: vi.fn(() => 2),
    internal: {
      pageSize: { getWidth: () => 595, getHeight: () => 842 },
    },
  };

  return {
    documento,
    jsPDF: vi.fn(function () {
      return documento;
    }),
    autoTable: vi.fn(),
    XLSX: {
      utils: {
        aoa_to_sheet: vi.fn(() => ({})),
        book_new: vi.fn(() => ({ hojas: [] })),
        book_append_sheet: vi.fn(),
      },
      writeFile: vi.fn(),
    },
  };
});

vi.mock("xlsx", () => ({ default: simulados.XLSX }));
vi.mock("jspdf", () => ({ jsPDF: simulados.jsPDF }));
vi.mock("jspdf-autotable", () => ({ default: simulados.autoTable }));

import { exportarExcel, exportarPDF } from "@/utils/exportarReporte";

const COLUMNAS = [
  { campo: "codigo", titulo: "Código" },
  { campo: "material", titulo: "Material" },
  { campo: "stock_actual", titulo: "Stock" },
];

const FILAS = [
  { codigo: "M1", material: "Cemento gris de uso general", stock_actual: 10 },
  { codigo: "M2", material: null, stock_actual: 0 },
];

const OPCIONES = {
  titulo: "Reporte de inventario",
  columnas: COLUMNAS,
  filas: FILAS,
  filtros: ["Bodega: Central", "Estado: Todos"],
  nombreArchivo: "reporte-inventario",
};

beforeEach(() => {
  vi.clearAllMocks();
  simulados.documento.getNumberOfPages.mockReturnValue(2);
});

describe("exportarExcel", () => {
  it("arma la hoja con título, fecha, filtros, encabezados y filas", async () => {
    await exportarExcel(OPCIONES);

    const [contenido] = simulados.XLSX.utils.aoa_to_sheet.mock.calls[0];

    expect(contenido[0]).toEqual(["Reporte de inventario"]);
    expect(contenido[1][0]).toMatch(/^Generado: /);
    expect(contenido[2]).toEqual(["Bodega: Central"]);
    expect(contenido[3]).toEqual(["Estado: Todos"]);
    expect(contenido[4]).toEqual([]);
    expect(contenido[5]).toEqual(["Código", "Material", "Stock"]);
    expect(contenido[6]).toEqual(["M1", "Cemento gris de uso general", 10]);
    // null / undefined se exportan como celda vacía; el 0 se conserva
    expect(contenido[7]).toEqual(["M2", "", 0]);
  });

  it("guarda el archivo con extensión .xlsx en la hoja 'Reporte'", async () => {
    await exportarExcel(OPCIONES);

    const libro = simulados.XLSX.utils.book_new.mock.results[0].value;
    expect(simulados.XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      libro,
      expect.any(Object),
      "Reporte"
    );
    expect(simulados.XLSX.writeFile).toHaveBeenCalledWith(libro, "reporte-inventario.xlsx");
  });

  it("calcula el ancho de las columnas con mínimo 10 y máximo 40", async () => {
    await exportarExcel({
      ...OPCIONES,
      filas: [{ codigo: "M1", material: "x".repeat(100), stock_actual: 1 }],
    });

    const hoja = simulados.XLSX.utils.aoa_to_sheet.mock.results[0].value;
    expect(hoja["!cols"]).toEqual([{ wch: 10 }, { wch: 40 }, { wch: 10 }]);
  });

  it("funciona sin filtros", async () => {
    await exportarExcel({ ...OPCIONES, filtros: undefined });

    const [contenido] = simulados.XLSX.utils.aoa_to_sheet.mock.calls[0];
    expect(contenido[2]).toEqual([]);
    expect(contenido[3]).toEqual(["Código", "Material", "Stock"]);
  });
});

describe("exportarPDF", () => {
  it("usa hoja vertical A4 con pocas columnas", async () => {
    await exportarPDF(OPCIONES);

    expect(simulados.jsPDF).toHaveBeenCalledWith({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
  });

  it("usa hoja horizontal con más de 6 columnas", async () => {
    const muchas = Array.from({ length: 7 }, (_, i) => ({ campo: `c${i}`, titulo: `C${i}` }));

    await exportarPDF({ ...OPCIONES, columnas: muchas, filas: [] });

    expect(simulados.jsPDF.mock.calls[0][0].orientation).toBe("landscape");
  });

  it("escribe el título, la fecha y cada filtro", async () => {
    await exportarPDF(OPCIONES);

    const textos = simulados.documento.text.mock.calls.map(([texto]) => texto);
    expect(textos[0]).toBe("Reporte de inventario");
    expect(textos[1]).toMatch(/^Generado: /);
    expect(textos).toContain("Bodega: Central");
    expect(textos).toContain("Estado: Todos");
  });

  it("genera la tabla con encabezados y celdas como texto", async () => {
    await exportarPDF(OPCIONES);

    const [documento, config] = simulados.autoTable.mock.calls[0];
    expect(documento).toBe(simulados.documento);
    expect(config.head).toEqual([["Código", "Material", "Stock"]]);
    expect(config.body).toEqual([
      ["M1", "Cemento gris de uso general", "10"],
      ["M2", "", "0"],
    ]);
  });

  it("numera todas las páginas en el pie", async () => {
    simulados.documento.getNumberOfPages.mockReturnValue(3);

    await exportarPDF(OPCIONES);

    expect(simulados.documento.setPage.mock.calls).toEqual([[1], [2], [3]]);
    const pies = simulados.documento.text.mock.calls
      .map(([texto]) => texto)
      .filter((texto) => texto.startsWith("Página"));
    expect(pies).toEqual(["Página 1 de 3", "Página 2 de 3", "Página 3 de 3"]);
  });

  it("guarda el archivo con extensión .pdf", async () => {
    await exportarPDF(OPCIONES);

    expect(simulados.documento.save).toHaveBeenCalledWith("reporte-inventario.pdf");
  });
});
