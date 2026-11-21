
// Pruebas del middleware de Next.js que protege las rutas del dashboard por rol.

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, middleware } from "@/middleware";

const BASE = "http://localhost:3000";

function pedir(ruta, rol) {
  const headers = rol ? { cookie: `usuario_rol=${encodeURIComponent(rol)}` } : {};
  return middleware(new NextRequest(`${BASE}${ruta}`, { headers }));
}

// NextResponse.next() no redirige: no tiene cabecera "location"
function dejaPasar(respuesta) {
  return respuesta.headers.get("location") === null;
}

describe("middleware de rutas por rol", () => {
  it("deja pasar rutas que no están protegidas", () => {
    expect(dejaPasar(pedir("/dashboard"))).toBe(true);
    expect(dejaPasar(pedir("/dashboard/otra-pagina"))).toBe(true);
  });

  it("sin cookie de rol redirige al login", () => {
    const respuesta = pedir("/dashboard/reportes");

    expect(respuesta.status).toBe(307);
    expect(respuesta.headers.get("location")).toBe(`${BASE}/`);
  });

  it("un rol sin permiso vuelve al dashboard con mensaje de error", () => {
    const respuesta = pedir("/dashboard/reportes", "Encargado");

    const destino = new URL(respuesta.headers.get("location"));
    expect(destino.pathname).toBe("/dashboard");
    expect(destino.searchParams.get("error")).toBe("sin-permiso");
  });

  it("decodifica roles con tilde y espacios (Jefa de Construcción)", () => {
    expect(dejaPasar(pedir("/dashboard/reportes", "Jefa de Construcción"))).toBe(true);
  });

  it("también protege las subrutas", () => {
    expect(dejaPasar(pedir("/dashboard/transferencias/15", "Jefe de Bodega"))).toBe(true);
    expect(dejaPasar(pedir("/dashboard/transferencias/15", "Encargado"))).toBe(false);
  });

  it("no confunde rutas que solo empiezan igual", () => {
    // "/dashboard/pedidos-viejos" no es "/dashboard/pedidos"
    expect(dejaPasar(pedir("/dashboard/pedidos-viejos"))).toBe(true);
  });

  it.each([
    ["/dashboard/materiales", ["Administrador", "Jefe de Bodega", "Encargado", "Jefa de Construcción"]],
    ["/dashboard/trazabilidad", ["Administrador", "Jefe de Bodega", "Encargado", "Jefa de Construcción"]],
    ["/dashboard/reportes", ["Administrador", "Jefe de Bodega", "Jefa de Construcción"]],
    ["/dashboard/transferencias", ["Jefe de Bodega"]],
    ["/dashboard/pedidos", ["Encargado"]],
    ["/dashboard/configuracion", ["Administrador"]],
  ])("%s solo permite: %j", (ruta, permitidos) => {
    const todos = ["Administrador", "Jefe de Bodega", "Encargado", "Jefa de Construcción"];

    for (const rol of todos) {
      expect(dejaPasar(pedir(ruta, rol)), `${rol} en ${ruta}`).toBe(permitidos.includes(rol));
    }
  });

  it("solo se ejecuta en las rutas del dashboard", () => {
    expect(config.matcher).toEqual(["/dashboard/:path*"]);
  });
});
