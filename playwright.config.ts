import { defineConfig, devices } from '@playwright/test';

const BROWSERS = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
] as const;

const SPECS = [
  { slug: '01', file: '01-play-complete-game.spec.ts' },
  { slug: '02', file: '02-undo-mistake.spec.ts' },
  { slug: '03', file: '03-review-history.spec.ts' },
] as const;

// 9 isolated project+server pairs so parallel spec-file execution within a
// browser project can never share data/current.json across test files.
let port = 8870;
const MATRIX = BROWSERS.flatMap((b) =>
  SPECS.map((s) => ({
    projectName: `${b.name}-${s.slug}`,
    browserName: b.name,
    device: b.device,
    specFile: `tests/e2e/${s.file}`,
    apiPort: port++,
    vitePort: port++,
    dataDir: `./data-test/${b.name}/${s.slug}`,
  })),
);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 32,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: MATRIX.map(({ projectName, device, vitePort, specFile }) => ({
    name: projectName,
    testMatch: specFile,
    use: { ...device, baseURL: `http://localhost:${vitePort}` },
  })),
  webServer: MATRIX.flatMap(({ apiPort, vitePort, dataDir }) => [
    {
      command: 'bun run dev:server',
      url: `http://localhost:${apiPort}/api/current`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { PORT: String(apiPort), QWIXX_DATA_DIR: dataDir },
    },
    {
      command: "bun run --filter '@qwixx/client' dev",
      url: `http://localhost:${vitePort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { VITE_PORT: String(vitePort), VITE_API_PORT: String(apiPort) },
    },
  ]),
});
