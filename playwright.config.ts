import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  webServer: {
    // Dedicated port, not 3000 — avoids colliding with an unrelated app
    // that may already be running there on a developer's machine.
    command: "pnpm run build && pnpm exec next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://localhost:3100",
  },
});
