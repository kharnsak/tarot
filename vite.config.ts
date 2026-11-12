import { rmSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// public/cards/raw holds source art for scripts/import-cards; it must not ship in the build.
const dropRawCards = {
  name: "drop-raw-cards",
  apply: "build" as const,
  closeBundle() {
    rmSync("dist/cards/raw", { recursive: true, force: true });
  },
};

export default defineConfig({
  plugins: [react(), dropRawCards],
  server: { host: "0.0.0.0" },
});
