import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "vscode-chat-customizations-evaluation/**",
      "node_modules/**",
      ".next/**",
      "sauvegardes/**",
      "logs/**",
      "monitoring/**",
    ],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
