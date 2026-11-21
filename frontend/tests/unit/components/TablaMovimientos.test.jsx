import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TablaMovimientos from "@/components/TablaMovimientos";

const MOVIMIENTO = {
  id_movimiento: 1,
  fecha_movimiento: "2026-11-04T09:30:00-06:00",
  tipo: "ENTRADA",
  codigo_material: "MAT-001",
  material: "Cemento",
  cantidad: 1500,
  unidad_medida: "Saco",
  origen: null,
  destino: "Bodega Central",
  responsable: "Carlos",
  observacion: "",
};

function filas() {
  // La primera fila es la de encabezados
  return screen.getAllByRole("row").slice(1);
}

function celdas(fila) {
  // Primera celda: <th scope="row"> con el N.º; el resto: <td>
  return [...fila.querySelectorAll("th, td")].map((celda) => celda.textContent);
}

describe("TablaMovimientos", () => {
  it("sin movimientos muestra el mensaje de lista vacía", () => {
    render(<TablaMovimientos movimientos={[]} />);

    expect(screen.getByText("No se encontraron movimientos")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("usa una lista vacía por defecto", () => {
    render(<TablaMovimientos />);

    expect(screen.getByText("No se encontraron movimientos")).toBeInTheDocument();
  });

  it.each([
    ["no es una lista", { movimientos: [] }],
    ["contiene null", [MOVIMIENTO, null]],
    ["contiene una lista", [[1, 2]]],
    ["contiene texto", ["movimiento"]],
  ])("avisa si el formato es inválido (%s)", (_caso, movimientos) => {
    render(<TablaMovimientos movimientos={movimientos} />);

    expect(screen.getByRole("alert")).toHaveTextContent("el formato recibido es inválido");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra los 10 encabezados y la cantidad de registros", () => {
    render(<TablaMovimientos movimientos={[MOVIMIENTO, { ...MOVIMIENTO, id_movimiento: 2 }]} />);

    expect(screen.getAllByRole("columnheader")).toHaveLength(10);
    expect(screen.getByText("2 registro(s) mostrados")).toBeInTheDocument();
    expect(filas()).toHaveLength(2);
  });

  it("muestra los datos de un movimiento con formato de Costa Rica", () => {
    render(<TablaMovimientos movimientos={[MOVIMIENTO]} />);

    const [id, fecha, tipo, material, cantidad, unidad, origen, destino, responsable, observacion] =
      celdas(filas()[0]);

    expect(id).toBe("1");
    expect(fecha).toMatch(/4\/11\/(20)?26/);
    expect(fecha).toMatch(/9:30/);
    expect(tipo).toBe("Entrada");
    expect(material).toContain("Cemento");
    expect(material).toContain("MAT-001");
    // Separador de miles es-CR (espacio fino o punto según el motor)
    expect(cantidad.replace(/\s| | |\./g, "")).toBe("1500");
    expect(unidad).toBe("Saco");
    // Los vacíos se muestran con guion largo
    expect(origen).toBe("—");
    expect(destino).toBe("Bodega Central");
    expect(responsable).toBe("Carlos");
    expect(observacion).toBe("—");
  });

  it("convierte la fecha UTC a hora de Costa Rica", () => {
    render(
      <TablaMovimientos
        movimientos={[{ ...MOVIMIENTO, fecha_movimiento: "2026-11-04T15:30:00Z" }]}
      />
    );

    expect(celdas(filas()[0])[1]).toMatch(/9:30/);
  });

  it.each([
    ["sin zona horaria", "2026-11-04T09:30:00", "Fecha sin zona horaria"],
    ["no es texto", 1730733000000, "Fecha sin zona horaria"],
    ["inválida", "fecha-maloZ", "Fecha inválida"],
    ["vacía", null, "—"],
  ])("maneja una fecha %s", (_caso, fecha, esperado) => {
    render(<TablaMovimientos movimientos={[{ ...MOVIMIENTO, fecha_movimiento: fecha }]} />);

    expect(celdas(filas()[0])[1]).toBe(esperado);
  });

  it.each([
    ["SALIDA", "Salida"],
    ["TRANSFERENCIA", "Transferencia"],
    ["AJUSTE", "AJUSTE"],
    [null, "—"],
  ])("muestra el tipo %s como '%s'", (tipo, esperado) => {
    render(<TablaMovimientos movimientos={[{ ...MOVIMIENTO, tipo }]} />);

    expect(celdas(filas()[0])[2]).toBe(esperado);
  });

  it.each([
    ["decimal en texto", "2.5", "2,5"],
    ["cero", 0, "0"],
    ["texto vacío", "  ", "—"],
    ["no numérico", "abc", "—"],
    ["objeto", { valor: 1 }, "—"],
    ["nulo", null, "—"],
  ])("formatea la cantidad (%s)", (_caso, cantidad, esperado) => {
    render(<TablaMovimientos movimientos={[{ ...MOVIMIENTO, cantidad }]} />);

    expect(celdas(filas()[0])[4]).toBe(esperado);
  });

  it("muestra '—' si el movimiento no trae id", () => {
    const { id_movimiento, ...sinId } = MOVIMIENTO;

    render(<TablaMovimientos movimientos={[sinId]} />);

    expect(celdas(filas()[0])[0]).toBe("—");
  });
});
