import { test, expect } from "@playwright/test"
import { loadTestFolder } from "@/tests/common"

test("Edit Properties", async ({ page }) => {
    await loadTestFolder(page)
    await expect(page.locator("#entity-browser-content")).toMatchAriaSnapshot(`
    - button "R Testing FolderDataset"
    - button "Data Entities":
      - img
    - button "F candles-9247498_1280.jpgFile"
    - button "F description.txtFile"
    - button "F empty-fileFile"
    - button "F example.jsonFile"
    - button "Contextual Entities":
      - img
    `)
    await page.getByRole("textbox").first().click()
    await page.getByRole("textbox").first().press("ControlOrMeta+a")
    await page.getByRole("textbox").first().fill("New Name of the Crate")
    await expect(page.getByRole("heading")).toMatchAriaSnapshot(`- text: New Name of the Crate`)
    await expect(page.locator(".bg-info")).toBeVisible()
    await expect(page.getByText("There are unsaved changes")).toBeVisible()
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByRole("listitem")).toMatchAriaSnapshot(
        `- listitem: R New Name of the Crate saved`
    )
    await page.getByRole("button", { name: "F empty-fileFile" }).click()
    await page.getByRole("textbox").nth(2).click()
    await page.getByRole("textbox").nth(2).fill("application/test")
    await expect(page.getByRole("textbox").nth(2)).toHaveValue("application/test")
    await expect(page.locator(".bg-info")).toBeVisible()
    await expect(page.getByText("There are unsaved changes")).toBeVisible()
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByRole("listitem").first()).toContainText("F empty-file saved")
    await expect(page.getByRole("textbox").nth(2)).toHaveValue("application/test")
    await expect(page.getByText("There are unsaved changes")).not.toBeVisible()
    await expect(page.locator(".bg-info")).not.toBeVisible()
})
