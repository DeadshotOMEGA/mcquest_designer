import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Load test environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const PORT = process.env.PORT || 3001

/**
 * Playwright configuration optimized for AI-first debugging.
 *
 * Key features:
 * - Screenshots, videos, and traces captured on failure
 * - Chromium-only (Firefox/Safari deferred to later phase)
 * - Parallel execution for speed (4 workers local, 1 in CI)
 * - Comprehensive artifact generation for AI analysis
 */
export default defineConfig({
  testDir: './e2e',

  // AI-first: maximize parallelism locally
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,

  // Retries for flake detection
  retries: process.env.CI ? 2 : 0,

  // Fail fast in CI
  forbidOnly: !!process.env.CI,

  // HTML report for artifact review
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  use: {
    baseURL: `http://localhost:${PORT}`,

    // AI debugging: capture everything on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Reasonable timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Chromium-only (for now)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Auto-start dev server
  webServer: {
    command: `NODE_ENV=test PORT=${PORT} pnpm run dev`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
