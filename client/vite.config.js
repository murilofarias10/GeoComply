import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // Forward API calls to the Express backend
      "/posts": "http://localhost:5000",
      "/fetch": "http://localhost:5000",
      "/analyze": "http://localhost:5000",
      "/stats": "http://localhost:5000",
      "/auth": "http://localhost:5000",
    },
  },
});
