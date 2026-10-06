import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the LOCAL Supabase stack (`npx supabase start`), never the hosted project.
 * The web server is built with local env so NEXT_PUBLIC_* values are inlined correctly.
 */
const PORT = 3200;
export const LOCAL_SUPABASE = {
  url: "http://127.0.0.1:56321",
  publishableKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
  secretKey: "LOCAL_SUPABASE_SECRET_FROM_STATUS",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "vi-VN",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/vi`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_SUPABASE_URL: LOCAL_SUPABASE.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: LOCAL_SUPABASE.publishableKey,
      SUPABASE_SERVICE_ROLE_KEY: LOCAL_SUPABASE.secretKey,
    },
  },
});
