import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/exportarReporte", () => ({
  exportarExcel: vi.fn(),
  exportarPDF: vi.fn(),
}));

import BotonesExportar from "@/components/BotonesExportar";
import { exportarExcel, exportarPDF } from "@/utils/exportarReporte";

const PROPS = {
  titulo: "Reporte",
  columnas: [{ campo: "codigo", titulo: "Código" }],
  filas: [{ codigo: "M1" }],
  filtros: ["Bodega: Central"],
  nombreArchivo: "reporte",
};

const OPCIONES_ESPERADAS = {
  titulo: "Reporte",
  columnas: PROPS.columnas,
  filas: PROPS.filas,
  filtros: PROPS.filtros,
  nombreArchivo: "reporte",
};

beforeEach(() => {
  vi.mocked(exportarExcel).mockReset().mockResolvedValue(undefined);
  vi.mocked(exportarPDF).mockReset().mockResolvedValue(undefined);
});

describe("BotonesExportar", () => {
  it("exporta a Excel con los datos recibidos", async () => {
    render(<BotonesExportar {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));

    await waitFor(() => expect(exportarExcel).toHaveBeenCalledWith(OPCIONES_ESPERADAS));
    expect(exportarPDF).not.toHaveBeenCalled();
  });

  it("exporta a PDF con los datos recibidos", async () => {
    render(<BotonesExportar {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar a PDF" }));

    await waitFor(() => expect(exportarPDF).toHaveBeenCalledWith(OPCIONES_ESPERADAS));
    expect(exportarExcel).not.toHaveBeenCalled();
  });

  it("usa una lista de filtros vacía por defecto", async () => {
    const { filtros, ...sinFiltros } = PROPS;
    render(<BotonesExportar {...sinFiltros} />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));

    await waitFor(() =>
      expect(exportarExcel).toHaveBeenCalledWith(expect.objectContaining({ filtros: [] }))
    );
  });

  it.each([
    ["sin filas", []],
    ["filas nulas", null],
  ])("desactiva los botones %s", (_caso, filas) => {
    render(<BotonesExportar {...PROPS} filas={filas} />);

    expect(screen.getByRole("button", { name: "Exportar a Excel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar a PDF" })).toBeDisabled();
    expect(screen.getByText("No hay datos para exportar.")).toBeInTheDocument();
  });

  it("muestra 'Generando...' y bloquea ambos botones mientras exporta", async () => {
    let terminar;
    vi.mocked(exportarExcel).mockReturnValue(new Promise((resolver) => (terminar = resolver)));

    render(<BotonesExportar {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar a Excel" }));

    const generando = await screen.findByRole("button", { name: "Generando Excel..." });
    expect(generando).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar a PDF" })).toBeDisabled();

    terminar();

    expect(await screen.findByRole("button", { name: "Exportar a Excel" })).toBeEnabled();
  });

  it("muestra un error si la exportación falla", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(exportarPDF).mockRejectedValue(new Error("fallo"));

    render(<BotonesExportar {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar a PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo generar el archivo. Intente nuevamente."
    );
    // Los botones vuelven a quedar disponibles para reintentar
    expect(screen.getByRole("button", { name: "Exportar a PDF" })).toBeEnabled();
  });

  it("borra el error anterior al reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(exportarPDF).mockRejectedValueOnce(new Error("fallo"));

    render(<BotonesExportar {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar a PDF" }));
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Exportar a PDF" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
