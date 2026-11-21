import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/permisoService", () => ({
  obtenerPermisos: vi.fn(),
}));

import { usePermisos } from "@/hooks/usePermisos";
import { obtenerPermisos } from "@/services/permisoService";

const USUARIO = { id_usuario: 1, nombre: "Carlos" };
const PERMISOS = {
  id_usuario: 1,
  rol: "Jefe de Bodega",
  permisos: ["ver_inventario", "aprobar_solicitud"],
};

beforeEach(() => {
  vi.mocked(obtenerPermisos).mockReset();
});

describe("usePermisos", () => {
  it("sin usuario en sesión no consulta y termina de cargar", async () => {
    const { result } = renderHook(() => usePermisos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.permisos).toEqual([]);
    expect(result.current.rol).toBeNull();
    expect(obtenerPermisos).not.toHaveBeenCalled();
  });

  it("consulta los permisos del usuario y los guarda en caché", async () => {
    sessionStorage.setItem("usuario", JSON.stringify(USUARIO));
    vi.mocked(obtenerPermisos).mockResolvedValue(PERMISOS);

    const { result } = renderHook(() => usePermisos());

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(obtenerPermisos).toHaveBeenCalledWith(1);
    expect(result.current.rol).toBe("Jefe de Bodega");
    expect(result.current.permisos).toEqual(PERMISOS.permisos);
    expect(JSON.parse(sessionStorage.getItem("permisos_usuario"))).toEqual(PERMISOS);
  });

  it("usa la caché si pertenece al mismo usuario", async () => {
    sessionStorage.setItem("usuario", JSON.stringify(USUARIO));
    sessionStorage.setItem("permisos_usuario", JSON.stringify(PERMISOS));

    const { result } = renderHook(() => usePermisos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerPermisos).not.toHaveBeenCalled();
    expect(result.current.rol).toBe("Jefe de Bodega");
  });

  it("ignora la caché de otro usuario y vuelve a consultar", async () => {
    sessionStorage.setItem("usuario", JSON.stringify(USUARIO));
    sessionStorage.setItem(
      "permisos_usuario",
      JSON.stringify({ id_usuario: 99, rol: "Administrador", permisos: ["gestionar_usuario"] })
    );
    vi.mocked(obtenerPermisos).mockResolvedValue(PERMISOS);

    const { result } = renderHook(() => usePermisos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerPermisos).toHaveBeenCalledWith(1);
    expect(result.current.rol).toBe("Jefe de Bodega");
  });

  it("ignora una caché dañada y vuelve a consultar", async () => {
    sessionStorage.setItem("usuario", JSON.stringify(USUARIO));
    sessionStorage.setItem("permisos_usuario", "{no es json");
    vi.mocked(obtenerPermisos).mockResolvedValue(PERMISOS);

    const { result } = renderHook(() => usePermisos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerPermisos).toHaveBeenCalledTimes(1);
    expect(result.current.permisos).toEqual(PERMISOS.permisos);
  });

  it("si la consulta falla deja al usuario sin permisos", async () => {
    sessionStorage.setItem("usuario", JSON.stringify(USUARIO));
    vi.mocked(obtenerPermisos).mockRejectedValue(new Error("sin conexión"));

    const { result } = renderHook(() => usePermisos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.permisos).toEqual([]);
    expect(result.current.rol).toBeNull();
    expect(sessionStorage.getItem("permisos_usuario")).toBeNull();
  });

  it("tienePermiso responde según la lista recibida", async () => {
    sessionStorage.setItem("usuario", JSON.stringify(USUARIO));
    vi.mocked(obtenerPermisos).mockResolvedValue(PERMISOS);

    const { result } = renderHook(() => usePermisos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.tienePermiso("aprobar_solicitud")).toBe(true);
    expect(result.current.tienePermiso("gestionar_usuario")).toBe(false);
  });
});
