import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/movies": "http://127.0.0.1:3000",
      "/query-file": "http://127.0.0.1:3000",
      "/query": "http://127.0.0.1:3000",
      "/schema": "http://127.0.0.1:3000",
    },
  },
});
