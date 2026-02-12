import { test, expect } from "@playwright/test"

test("Landing Page Tests", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await expect(page.getByText("Your local RO-Crates will be shown here.")).toBeVisible()
    await page.getByRole("button", { name: "Import RO-Crate" }).click()
    await page.getByTestId("create-upload-input").setInputFiles("tests/data/TestCrate.zip")
    await page.getByRole("menuitem", { name: "Editor" }).click()
    await page.getByRole("menuitem", { name: "Back to Main Menu" }).click()
    await expect(page.getByText("TestCrate")).toBeVisible()
    await page.getByRole("button", { name: "More" }).click()
    await page.getByRole("menuitem", { name: "Permanently Delete" }).click()
    await page.getByRole("button", { name: "Delete" }).click()
    await expect(page.getByText("Your local RO-Crates will be shown here.")).toBeVisible()
})
