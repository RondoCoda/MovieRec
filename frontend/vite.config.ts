import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on 5173, which backend/app/main.py already allows via CORS.
// The /api proxy lets us use relative URLs in dev; in production set VITE_API_BASE.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
