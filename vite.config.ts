import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Served from https://<user>.github.io/pimenta/
export default defineConfig({
  base: "/pimenta/",
  plugins: [react()],
  // Older Android browsers (Huawei, Samsung Internet) lag Chrome; compile syntax down for them.
  build: { target: ["es2019", "chrome79"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
