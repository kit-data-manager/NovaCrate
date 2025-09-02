import { defineConfig, devices } from "playwright/test"

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    workers: process.env.CI ? 1 : 4,
    retries: process.env.CI ? 2 : 0,
    forbidOnly: !!process.env.CI,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3000/",
        trace: "on-first-retry",
        launchOptions: {
            slowMo: 100
        }
    },
    projects: [
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] }
        },
        {
            name: "chrome",
            use: { ...devices["Desktop Chrome"] }
        }
    ],
    webServer: process.env.CI
        ? {
              command: `npm run serve`,
              url: "http://localhost:3000/",
              timeout: 120 * 1000
          }
        : undefined
})
