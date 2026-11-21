// Utilidades para simular fetch en las pruebas de los services.

import { vi } from "vitest";

// Misma URL base que usan los services
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Crea una respuesta parecida a la de fetch
export function respuesta(status, cuerpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => {
      if (cuerpo instanceof Error) throw cuerpo;
      return cuerpo;
    }),
  };
}

// Reemplaza fetch global; devuelve el mock para revisar las llamadas
export function simularFetch(status, cuerpo) {
  const mock = vi.fn(async () => respuesta(status, cuerpo));
  vi.stubGlobal("fetch", mock);
  return mock;
}

// Devuelve la URL y las opciones de la llamada número "indice"
export function llamada(mock, indice = 0) {
  const [url, opciones = {}] = mock.mock.calls[indice];
  return { url, opciones, body: opciones.body ? JSON.parse(opciones.body) : undefined };
}
