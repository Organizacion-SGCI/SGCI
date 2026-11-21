// @vitest-environment node
import { describe, expect, it } from "vitest";

import { iniciarSesion } from "@/services/authService";
import { API_URL, llamada, simularFetch } from "../helpers/fetch";

describe("authService.iniciarSesion", () => {
  it("envía correo y contraseña por POST a /login/", async () => {
    const fetchMock = simularFetch(200, { token: "abc" });

    await iniciarSesion("carlos@sgci.com", "123456");

    const { url, opciones, body } = llamada(fetchMock);
    expect(url).toBe(`${API_URL}/login/`);
    expect(opciones.method).toBe("POST");
    expect(opciones.headers["Content-Type"]).toBe("application/json");
    expect(body).toEqual({ correo: "carlos@sgci.com", password: "123456" });
  });

  it("devuelve los datos de la sesión cuando el login es correcto", async () => {
    const datos = { token: "abc", usuario: { id_usuario: 1 } };
    simularFetch(200, datos);

    await expect(iniciarSesion("a@b.com", "x")).resolves.toEqual(datos);
  });

  it("lanza el mensaje del backend cuando las credenciales fallan", async () => {
    simularFetch(401, { detail: "Credenciales incorrectas" });

    await expect(iniciarSesion("a@b.com", "x")).rejects.toThrow(
      "Credenciales incorrectas"
    );
  });

  it("usa un mensaje genérico si el backend no manda detalle", async () => {
    simularFetch(500, {});

    await expect(iniciarSesion("a@b.com", "x")).rejects.toThrow(
      "Error al iniciar sesión"
    );
  });
});
