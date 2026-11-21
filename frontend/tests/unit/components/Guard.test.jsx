import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/usePermisos", () => ({
  usePermisos: vi.fn(),
}));

import Guard from "@/components/Guard";
import { usePermisos } from "@/hooks/usePermisos";

function simularPermisos({ cargando = false, permisos = [] } = {}) {
  vi.mocked(usePermisos).mockReturnValue({
    cargando,
    permisos,
    rol: null,
    tienePermiso: (permiso) => permisos.includes(permiso),
  });
}

beforeEach(() => {
  vi.mocked(usePermisos).mockReset();
});

describe("Guard", () => {
  it("muestra el contenido si el usuario tiene el permiso", () => {
    simularPermisos({ permisos: ["emitir_vale"] });

    render(
      <Guard permiso="emitir_vale">
        <button>Emitir vale</button>
      </Guard>
    );

    expect(screen.getByRole("button", { name: "Emitir vale" })).toBeInTheDocument();
  });

  it("oculta el contenido si el usuario no tiene el permiso", () => {
    simularPermisos({ permisos: ["ver_inventario"] });

    render(
      <Guard permiso="emitir_vale">
        <button>Emitir vale</button>
      </Guard>
    );

    expect(screen.queryByRole("button", { name: "Emitir vale" })).not.toBeInTheDocument();
  });

  it("muestra el fallback cuando no hay permiso", () => {
    simularPermisos({ permisos: [] });

    render(
      <Guard permiso="emitir_vale" fallback={<p>Sin acceso</p>}>
        <button>Emitir vale</button>
      </Guard>
    );

    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
  });

  it("no muestra nada mientras cargan los permisos (ni el fallback)", () => {
    simularPermisos({ cargando: true, permisos: ["emitir_vale"] });

    const { container } = render(
      <Guard permiso="emitir_vale" fallback={<p>Sin acceso</p>}>
        <button>Emitir vale</button>
      </Guard>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
