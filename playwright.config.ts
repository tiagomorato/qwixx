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
  { slug: '04', file: '04-per-row-scores.spec.ts' },
  { slug: '05', file: '05-turn-sync.spec.ts' },
  { slug: '06', file: '06-haptics.spec.ts' },
  { slug: '07', file: '07-theme-toggle.spec.ts' },
  { slug: '08', file: '08-penalty-guard.spec.ts' },
  { slug: '09', file: '09-undo-notice.spec.ts' },
  { slug: '10', file: '10-wrapup-rematch.spec.ts' },
  { slug: '11', file: '11-layout-density.spec.ts' },
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
    // Screens fade in on mount. Reduced motion (which the app honours) makes axe
    // audit the settled colours instead of a half-faded frame.
    contextOptions: { reducedMotion: 'reduce' },
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
      // No --watch: 66 watching servers exhaust the inotify instance limit.
      command: 'bun run server/src/index.ts',
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
