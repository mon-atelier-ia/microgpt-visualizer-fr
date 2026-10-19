import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
  },
  build: {
    rolldownOptions: {
      output: {
        // Vite 8: codeSplitting groups replace the deprecated manualChunks.
        // "react" first: a group pulls its dependencies in, and the group with
        // the smaller index claims a module first (rolldown CodeSplittingGroup).
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/]react[\\/]/ },
            { name: "react-dom", test: /node_modules[\\/]react-dom[\\/]/ },
          ],
        },
      },
    },
  },
});
