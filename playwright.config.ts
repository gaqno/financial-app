import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000, // Increase timeout to 60 seconds
  expect: {
    timeout: 10000 // Increase expect timeout
  },
  fullyParallel: false, // Run tests sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for consistent state
  reporter: 'html',
  
  // Global setup for authentication
  globalSetup: './tests/e2e/global-setup.ts',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Use saved authentication state
    storageState: '.auth/user.json',
  },

  projects: [
    // Setup project to create auth state
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    // Auth tests - start from logged out state
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] }, // Start with empty state
      },
      // Don't depend on setup for auth tests
    },
    // All other tests - use authenticated state
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts/, // Exclude auth tests from this project
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}); 