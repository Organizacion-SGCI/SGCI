// Se ejecuta antes de cada archivo de pruebas.

import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  // Desmonta los componentes renderizados y limpia la sesión simulada
  cleanup();

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }
});
