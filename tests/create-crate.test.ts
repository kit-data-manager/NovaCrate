import { test, expect } from "@playwright/test"

test("Create Crate from Scratch", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "New Crate" }).click()
    await page.getByRole("menuitem", { name: "Start from scratch" }).click()
    await page.getByRole("textbox", { name: "Name" }).click()
    await page.getByRole("textbox", { name: "Name" }).fill("Some Test Crate")
    await page.getByRole("textbox", { name: "Name" }).press("Tab")
    await page.getByRole("textbox", { name: "Description" }).fill("Random Description Test")
    await page.getByRole("textbox", { name: "Description" }).press("Enter")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByText("NovaCrateSome Test Crate")).toBeVisible()
    await expect(page.getByRole("textbox").first()).toHaveValue("Some Test Crate")
    await expect(page.getByRole("textbox").nth(1)).toHaveValue("Random Description Test")
})
