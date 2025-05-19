import { defineConfig, devices } from "playwright/test"

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    workers: process.env.CI ? 1 : undefined,
    retries: process.env.CI ? 2 : 0,
    forbidOnly: !!process.env.CI,
    reporter: [["html", { open: "never" }]],
    use: {
        baseURL: "http://localhost:3000/",
        trace: "on-first-retry"
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
    webServer: {
        command: `npm run dev`,
        url: "http://localhost:3000/",
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI
    }
})
