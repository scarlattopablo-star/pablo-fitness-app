import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://pabloscarlattoentrenamientos.com";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: BASE_URL,
    headless: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
