import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { E2E_API_PORT, E2E_API_URL, E2E_WEB_PORT, E2E_WEB_URL as webUrl } from './e2e/env';

// End-to-end tests: the web export and the real backend against a real Postgres.
// `npm run e2e` starts both (see webServer below); Postgres must already be running.
// Locally that is the dev DB from backend/docker-compose.yml, whose password is read from
// backend/.env; CI starts a Postgres service and passes E2E_DB_* instead.
// Ports: e2e/env.ts.

function devDbPassword(): string | undefined {
  try {
    const env = readFileSync(join(__dirname, '../backend/.env'), 'utf8');
    return env.match(/^POSTGRES_PASSWORD=(.*)$/m)?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  // Every test registers its own user, so tests are independent and can run in parallel
  fullyParallel: true,
  workers: isCI ? 2 : undefined,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [['list'], ['html', { outputFolder: './e2e/.report', open: 'never' }]] : 'list',
  use: {
    baseURL: webUrl,
    // Traces cost CPU on every test; keep them for failures only
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // The app is built for phones: a phone-sized viewport with touch
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: [
    {
      // A separate `e2e` profile, so a machine's application-local.properties is never read
      command: './gradlew bootRun --no-daemon --quiet',
      cwd: '../backend/training-backend',
      url: `http://localhost:${E2E_API_PORT}/actuator/health/readiness`,
      timeout: 300_000,
      reuseExistingServer: !isCI,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        SPRING_PROFILES_ACTIVE: 'e2e',
        SERVER_PORT: String(E2E_API_PORT),
        SPRING_DATASOURCE_URL: process.env.E2E_DB_URL ?? 'jdbc:postgresql://localhost:5432/training_db',
        SPRING_DATASOURCE_USERNAME: process.env.E2E_DB_USER ?? 'training_user',
        SPRING_DATASOURCE_PASSWORD: process.env.E2E_DB_PASSWORD ?? devDbPassword() ?? '',
        SPRING_JPA_SHOW_SQL: 'false',
        JWT_SECRET: 'e2e-only-secret-do-not-use-in-production-0123456789abcdef',
        CORS_ALLOWED_ORIGINS: webUrl,
        // Every test registers a user from the same address
        AUTH_RATELIMIT_LOGINPERIP_LIMIT: '100000',
        AUTH_RATELIMIT_LOGINPERUSERNAME_LIMIT: '100000',
        AUTH_RATELIMIT_REGISTERPERIP_LIMIT: '100000',
        AUTH_RATELIMIT_REFRESHPERIP_LIMIT: '100000',
      },
    },
    {
      // A production web export (no Metro), served the way Nginx serves it in deployment
      command: `npx expo export --platform web --output-dir e2e/.dist && node e2e/serve.mjs e2e/.dist ${E2E_WEB_PORT}`,
      url: webUrl,
      timeout: 600_000,
      reuseExistingServer: !isCI,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { EXPO_PUBLIC_API_URL: E2E_API_URL },
    },
  ],
});
