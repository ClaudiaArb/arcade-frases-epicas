import { defineConfig } from "vite";

// El .wasm de sql.js se importa con "?url" en database.ts:
// Vite lo copia a /dist y Vercel lo sirve desde el mismo dominio (sin depender de sql.js.org).
export default defineConfig({
  build: { outDir: "dist", target: "es2020" },
});
