import { test, expect } from "@playwright/test"
import { loadTestCrate } from "@/tests/common"

test("Rename Contextual Entity", async ({ page }) => {
    await loadTestCrate(page)

    await page.getByRole("button", { name: "C KarlsruhePlace" }).click()
    await page.locator("#id-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Edit" }).click()
    await page.getByRole("textbox", { name: "#localname or https://" }).fill("#karlsruhe")
    await page.getByRole("button", { name: "Confirm" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - heading "Contextual Karlsruhe" [level=2]:
      - button "Contextual"
    - text: Identifier
    - paragraph: The unique identifier of the entity
    - text: "#karlsruhe"
    - button
    - text: Type
    - paragraph: The type defines which properties can occur on the entity
    - button "Place"
    - button
    - button "Add another type"
    - text: Name
    - paragraph: The name of the item.
    - button
    - textbox: Karlsruhe
    - button
    - button "Add another entry"
    - button "Add Property"
    `)
    await expect(page.locator("#entity-browser-content")).toMatchAriaSnapshot(`
    - button "R TestCrateDataset"
    - button "Data Entities":
      - img
    - button "F JSON Result FileFile"
    - button "Contextual Entities":
      - img
    - button "C Example OrgOrganization"
    - button "C KarlsruhePlace"
    - button "C Test PersonPerson"
    `)
})

test("Rename File", async ({ page }) => {
    await loadTestCrate(page)

    await page.getByRole("button", { name: "F JSON Result FileFile" }).click()
    await page.locator("#id-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Edit" }).click()
    await page
        .getByRole("textbox", { name: "#localname or https://" })
        .fill("Subfolder/resultFile.txt")
    await page.getByRole("button", { name: "Confirm" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - text: Subfolder/resultFile.txt
    - button
    `)
    await page.getByRole("button", { name: "Preview File" }).click()
    await expect(page.getByRole("code")).toContainText('"entry": {')
    await page.getByRole("button", { name: "File Explorer" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "Subfolder":
      - img
    - button "resultFile.txtJSON Result File"
    - button "ro-crate-metadata.json"
    `)
})
