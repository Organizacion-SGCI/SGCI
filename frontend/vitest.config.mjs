// Configuración de Vitest para las pruebas unitarias del frontend.
// Las pruebas viven en tests/unit/ y se ejecutan con:  npm test


import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mismo alias que jsconfig.json:  "@/..." -> "src/..."
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.js"],
    include: ["tests/unit/**/*.test.{js,jsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: [
        "src/services/**",
        "src/utils/**",
        "src/hooks/**",
        "src/components/Guard.jsx",
        "src/components/BotonesExportar.jsx",
        "src/components/TablaMovimientos.jsx",
        "src/middleware.ts",
      ],
    },
  },
});
