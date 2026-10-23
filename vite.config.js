import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from /<repo>/, so assets need that base path in production builds.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/focuslist/" : "/",
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.js",
    globals: true,
  },
}));
