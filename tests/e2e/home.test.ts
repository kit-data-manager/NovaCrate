import { test, expect } from "@playwright/test"

test("landing page", async ({ page }) => {
    await page.goto("http://localhost:3000/")
    await expect(page.getByRole("heading", { name: "NovaCrate" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "The RO-Crate principles" })).toBeVisible()
    await expect(page.getByText("Core Features of NovaCrate")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible()
})
