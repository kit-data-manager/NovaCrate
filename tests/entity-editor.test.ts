import { test, expect } from "@playwright/test"
import { loadTestCrate, loadTestFolder } from "@/tests/common"

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

test("Edit different Property Types (no links), then save", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await loadTestCrate(page)

    await page.getByRole("textbox").first().dblclick()
    await page.getByRole("textbox").first().fill("Crate Root Name")
    await expect(page.getByRole("heading")).toContainText("Crate Root Name")
    await page.locator('input[type="datetime-local"]').click()
    await page.locator('input[type="datetime-local"]').fill("2001-10-23T23:41")
    await page.getByRole("textbox").nth(2).click()
    await page.getByRole("textbox").nth(2).fill("My Description of the Crate")
    await expect(page.locator(".bg-info").first()).toBeVisible()
    await expect(page.locator("div:nth-child(2) > .grid > .bg-info")).toBeVisible()
    await expect(page.locator("div:nth-child(3) > .grid > .bg-info")).toBeVisible()
    await expect(page.getByText("There are unsaved changes")).toBeVisible()
    await page.getByRole("switch").first().click()
    await expect(page.locator("div:nth-child(5) > .grid > .bg-info")).toBeVisible()
    await page.getByRole("switch").first().click()
    await expect(page.locator("div:nth-child(5) > .grid > .bg-info")).not.toBeVisible()
    await page.getByRole("switch").nth(1).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - switch [checked]
    - text: "True"
    - button
    - switch [checked]
    - text: "True"
    - button
    - button "Add another entry"
    `)
    await page.getByRole("spinbutton").click()
    await page.getByRole("spinbutton").fill("22")
    await page.getByRole("textbox").nth(3).click()
    await page.getByRole("textbox").nth(3).fill("v29.0.2")
    await expect(page.locator("div:nth-child(6) > .grid > .bg-info")).toBeVisible()
    await expect(page.getByRole("spinbutton")).toHaveValue("22")
    await expect(page.getByRole("textbox").nth(3)).toHaveValue("v29.0.2")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByRole("listitem")).toMatchAriaSnapshot(
        `- listitem: R Crate Root Name saved`
    )
    await expect(page.getByRole("textbox").first()).toHaveValue("Crate Root Name")
    await expect(page.locator('input[type="datetime-local"]')).toHaveValue("2001-10-23T23:41")
    await expect(page.getByRole("textbox").nth(2)).toHaveValue("My Description of the Crate")
    await expect(page.getByRole("spinbutton")).toHaveValue("22")
    await expect(page.getByRole("textbox").nth(3)).toHaveValue("v29.0.2")
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - switch [checked]
    - text: "True"
    - button
    - switch [checked]
    - text: "True"
    - button
    - button "Add another entry"
    `)
})

test("Change field type and change back", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await loadTestCrate(page)

    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - spinbutton: /\\d+/
    - button
    - textbox: v25.0.0
    - button
    - button "Add another entry"
    `)
    await page
        .locator("#single-property-editor-version-0 #single-property-dropdown-trigger")
        .click()
    await page.getByRole("menuitem", { name: "Change Type" }).click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - textbox: /\\d+/
    - button
    - textbox: v25.0.0
    - button
    - button "Add another entry"
    `)
    await page.getByRole("textbox").nth(3).click()
    await page.getByRole("textbox").nth(3).fill("25 und mehr")
    await page
        .locator("#single-property-editor-version-0 #single-property-dropdown-trigger")
        .click()
    await page.getByRole("menuitem", { name: "Change Type" }).click()
    await page.getByRole("menuitem", { name: "Number" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - spinbutton: "0"
    - button
    - textbox: v25.0.0
    - button
    - button "Add another entry"
    `)
    await expect(page.locator(".bg-info")).toBeVisible()
    await expect(page.getByText("There are unsaved changes")).toBeVisible()
    await page
        .locator("div")
        .filter({ hasText: /^There are unsaved changesSave$/ })
        .getByRole("button")
        .nth(1)
        .click()
    await page.getByRole("menuitem", { name: "Revert Changes ⌘U" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - spinbutton: 25
    - button
    - textbox: v25.0.0
    - button
    - button "Add another entry"
    `)
})

test("Change field type and revert", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await loadTestCrate(page)

    await page.getByRole("spinbutton").click()
    await page
        .locator("#single-property-editor-version-0 #single-property-dropdown-trigger")
        .click()
    await page.getByRole("menuitem", { name: "Change Type" }).click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await page.getByRole("textbox").nth(3).click()
    await page.getByRole("textbox").nth(3).fill("25 und mehr")
    await page
        .locator("div")
        .filter({ hasText: /^There are unsaved changesSave$/ })
        .getByRole("button")
        .nth(1)
        .click()
    await page.getByRole("menuitem", { name: "Revert Changes ⌘U" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - textbox: 25
    - button
    - textbox: v25.0.0
    - button
    - button "Add another entry"
    `)
})

test("Add Entries of different types and save", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await loadTestCrate(page)

    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Number" }).click()
    await page.getByRole("textbox").nth(4).click()
    await page.getByRole("textbox").nth(4).fill("Ein Versionstext")
    await page.getByRole("spinbutton").nth(1).click()
    await page.getByRole("spinbutton").nth(1).fill("33")
    await expect(page.locator(".bg-info")).toBeVisible()
    await expect(page.getByText("There are unsaved changes")).toBeVisible()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - spinbutton: /\\d+/
    - button
    - textbox: v25.0.0
    - button
    - textbox: Ein Versionstext
    - button
    - spinbutton: /\\d+/
    - button
    - button "Add another entry"
    `)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - spinbutton: /\\d+/
    - button
    - textbox: v25.0.0
    - button
    - textbox: Ein Versionstext
    - button
    - spinbutton: /\\d+/
    - button
    - button "Add another entry"
    `)
})

test("Add Reference and follow it", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await loadTestCrate(page)

    await page.locator("#property-editor-hasPart-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Reference" }).click()
    await page.getByRole("button", { name: "Link" }).click()
    await page.getByLabel("Suggestions").getByText("FJSON Result FileFile").click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "F JSON Result File"
    - button
    - button
    - button "F JSON Result File"
    - button
    - button
    - button "Add another entry"
    `)
    await expect(page.locator(".bg-info")).toBeVisible()
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "F JSON Result File"
    - button
    - button
    - button "F JSON Result File"
    - button
    - button
    - button "Add another entry"
    `)
    await page.getByRole("button", { name: "F JSON Result File" }).nth(1).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - heading "File JSON Result File" [level=2]:
      - button "File"
    - text: Identifier
    - paragraph: The unique identifier of the entity
    - text: result.json
    - button
    - text: Type
    - paragraph: The type defines which properties can occur on the entity
    - button "File"
    - button
    - button "Add another type"
    - text: Name
    - paragraph: The name of the item.
    - textbox: JSON Result File
    - button
    - button "Add another entry"
    - text: Content Size
    - paragraph: File size in (mega/kilo)bytes.
    - textbox: /\\d+/
    - button
    - button "Add another entry"
    - text: Encoding Format
    - paragraph:
      - text: Media type typically expressed using a MIME format (see
      - link "IANA site":
        - /url: http://www.iana.org/assignments/media-types/media-types.xhtml
      - text: and
      - link "MDN reference":
        - /url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
      - text: ), e.g. application/zip for a SoftwareApplication binary, audio/mpeg for .mp3 etc.
    - paragraph:
      - text: In cases where a
      - link "CreativeWork":
        - /url: https://schema.org/CreativeWork
      - text: has several media type representations,
      - link "encoding":
        - /url: https://schema.org/encoding
      - text: can be used to indicate each
      - link "MediaObject":
        - /url: https://schema.org/MediaObject
      - text: alongside particular
      - link "encodingFormat":
        - /url: https://schema.org/encodingFormat
      - text: information.
    - paragraph: Unregistered or niche encoding and file formats can be indicated instead via the most appropriate URL, e.g. defining Web page or a Wikipedia/Wikidata entry.
    - textbox: application/json
    - button
    - button "Add another entry"
    - button "Add Property"
    `)
})

test("Add many properties and test pagination", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await loadTestCrate(page)

    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await page.locator("#property-editor-version-right #add-property-dropdown-trigger").click()
    await page.getByRole("menuitem", { name: "Text" }).click()
    await expect(page.getByText("Text Number")).not.toBeVisible()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - textbox
    - button
    - textbox
    - button
    - button "Add another entry"
    - button
    - button "2 / 2"
    - button
    `)
    await page
        .locator("div")
        .filter({ hasText: /^2 \/ 2$/ })
        .getByRole("button")
        .first()
        .click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - spinbutton: /\\d+/
    - button
    - textbox: v25.0.0
    - button
    - textbox
    - button
    - textbox
    - button
    - textbox
    - button
    - textbox
    - button
    - textbox
    - button
    - textbox
    - button
    - textbox
    - button
    - textbox
    - button
    - button "Add another entry"
    - button
    - button "1 / 2"
    - button
    `)
    await page.getByRole("button", { name: "/ 2" }).click()
    await page.getByRole("dialog").getByRole("spinbutton").fill("2")
    await page.getByRole("dialog").getByRole("button").click()
    await expect(page.getByRole("dialog")).toContainText(
        "There are 2 pages with 10 entries per page. In total, there are 12 entries."
    )
})
