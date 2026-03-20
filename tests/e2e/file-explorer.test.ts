import { test, expect } from "@playwright/test"

test("file explorer should associate entities correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import RO-Crate" }).click()
    await page
        .getByTestId("create-upload-input")
        .setInputFiles("tests/data/air-quality-karlsruhe.zip")
    await page.getByRole("link", { name: "File Explorer" }).getByRole("button").click()
    await expect(page.getByRole("tree")).toMatchAriaSnapshot(`
    - treeitem "Air quality measurements in Karlsruhe" [expanded] [level=1]
    - treeitem "__MACOSX" [expanded] [level=2]
    - treeitem "._map.pdf" [expanded] [level=3]
    - treeitem "._ro-crate-metadata.json" [expanded] [level=3]
    - treeitem "measurements" [expanded] [level=3]
    - treeitem "._test.txt" [expanded] [level=4]
    - treeitem "map.pdf" [expanded] [level=2]
    - treeitem "measurements" [expanded] [level=2]
    - treeitem "test.txt" [expanded] [level=3]
    - treeitem "ro-crate-metadata.json" [expanded] [level=2]
    `)
    await page.locator("#toggle-show-entities").click()
    await expect(page.getByRole("tree")).toMatchAriaSnapshot(`
    - treeitem "R Air quality measurements in Karlsruhe" [expanded] [level=1]
    - treeitem "__MACOSX" [expanded] [level=2]
    - treeitem "._map.pdf" [expanded] [level=3]
    - treeitem "._ro-crate-metadata.json" [expanded] [level=3]
    - treeitem "measurements" [expanded] [level=3]
    - treeitem "._test.txt" [expanded] [level=4]
    - treeitem "F Map of measurements" [expanded] [level=2]
    - treeitem "measurements" [expanded] [level=2]
    - treeitem "test.txt" [expanded] [level=3]
    - treeitem "C ro-crate-metadata.json" [expanded] [level=2]
    `)
    await page
        .locator("div")
        .filter({ hasText: /^test\.txt$/ })
        .nth(1)
        .click({
            button: "right"
        })
    await page.getByRole("menuitem", { name: "Create Entity" }).click()
    await page.locator("div").filter({ hasText: "FileImport a new single file" }).nth(2).click()
    await page.getByRole("textbox", { name: "Entity Name" }).click()
    await page.getByRole("textbox", { name: "Entity Name" }).press("ControlOrMeta+a")
    await page.getByRole("textbox", { name: "Entity Name" }).fill("Test results")
    await page.getByRole("textbox", { name: "Entity Name" }).press("Enter")
    await expect(page.getByRole("tree")).toMatchAriaSnapshot(`
    - treeitem "R Air quality measurements in Karlsruhe" [expanded] [level=1]
    - treeitem "__MACOSX" [expanded] [level=2]
    - treeitem "._map.pdf" [expanded] [level=3]
    - treeitem "._ro-crate-metadata.json" [expanded] [level=3]
    - treeitem "measurements" [expanded] [level=3]
    - treeitem "._test.txt" [expanded] [level=4]
    - treeitem "F Map of measurements" [expanded] [level=2]
    - treeitem "measurements" [expanded] [level=2]
    - treeitem "F Test results" [expanded] [level=3] [selected]
    - treeitem "C ro-crate-metadata.json" [expanded] [level=2]
    `)
})

test("renaming works", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import RO-Crate" }).click()
    await page
        .getByTestId("create-upload-input")
        .setInputFiles("tests/data/air-quality-karlsruhe.zip")
    await page.getByRole("link", { name: "File Explorer" }).getByRole("button").click()
    await page
        .locator("div")
        .filter({ hasText: /^test\.txt$/ })
        .nth(1)
        .click({
            button: "right"
        })
    await page.getByRole("menuitem", { name: "Change File Name" }).click()
    await page.getByRole("textbox").press("ControlOrMeta+a")
    await page.getByRole("textbox").fill("measurement-test.txt")
    await page.getByRole("textbox").press("Enter")
    await page.getByRole("dialog", { name: "Change Entity Identifier" }).click()
    await page.getByRole("button", { name: "Confirm" }).click()
    await expect(page.getByRole("tree")).toMatchAriaSnapshot(`
    - treeitem "Air quality measurements in Karlsruhe" [expanded] [level=1]
    - treeitem "__MACOSX" [expanded] [level=2]
    - treeitem "._map.pdf" [expanded] [level=3]
    - treeitem "._ro-crate-metadata.json" [expanded] [level=3]
    - treeitem "measurements" [expanded] [level=3]
    - treeitem "._test.txt" [expanded] [level=4]
    - treeitem "map.pdf" [expanded] [level=2]
    - treeitem "measurements" [expanded] [level=2]
    - treeitem "measurement-test.txt" [expanded] [level=3]
    - treeitem "ro-crate-metadata.json" [expanded] [level=2]
    `)
})

test("uploading with tree picker works", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import RO-Crate" }).click()
    await page
        .getByTestId("create-upload-input")
        .setInputFiles("tests/data/air-quality-karlsruhe.zip")
    await page.getByRole("button", { name: "Add new Entity" }).click()
    await page.locator("div").filter({ hasText: "FileImport a new single file" }).nth(2).click()
    await page.getByRole("button", { name: "Back" }).click()
    await page.getByText("Import a folder, including").click()
    await page.getByRole("button", { name: "Empty Folder" }).click()
    await page.getByRole("textbox", { name: "Folder Name" }).click()
    await page.getByRole("textbox", { name: "Folder Name" }).fill("extraData")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByRole("button", { name: "D extraData" })).toBeVisible()
    await page.getByRole("link", { name: "File Explorer" }).getByRole("button").click()
    await expect(
        page
            .locator("div")
            .filter({ hasText: /^extraData$/ })
            .nth(1)
    ).toBeVisible()
    await page.getByRole("link", { name: "Entity Editor" }).getByRole("button").click()
    await page.getByRole("button", { name: "Add new Entity" }).click()
    await page.locator("div").filter({ hasText: "FileImport a new single file" }).nth(2).click()
    await page.getByTestId("path-picker-extraData/").click()
    await page.getByRole("button", { name: "Select File" }).click()
    await page
        .getByTestId("create-entity-file-upload")
        .setInputFiles("tests/data/TestFolder/img/candles-9247498_1280.jpg")
    await page.getByRole("button", { name: "Create" }).click()
    await page.getByRole("button", { name: "F candles-9247498_1280.jpgFile" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - heading "File candles-9247498_1280.jpg" [level=2]:
      - button "File"
      - text: candles-9247498_1280.jpg
    - button
    - text: Identifier
    - paragraph: The unique identifier of the entity
    - text: extraData/candles-9247498_1280.jpg
    - button
    - button
    - text: Type
    - paragraph: The type defines which properties can occur on the entity
    - button "File"
    - button
    - button
    - button "Add another type"
    - text: Name
    - paragraph: The name of the item.
    - button
    - textbox: candles-9247498_1280.jpg
    - button
    - button
    - button "Add another entry"
    - text: Content Size
    - paragraph: File size in (mega/kilo)bytes.
    - button
    - textbox: /\\d+/
    - button
    - button
    - button "Add another entry"
    - text: Date Modified
    - paragraph: The date on which the CreativeWork was most recently modified or when the item's entry was modified within a DataFeed.
    - textbox: /\\d+-\\d+-20T11:\\d+/
    - button
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
    - button
    - textbox: image/jpeg
    - button
    - button
    - button "Add another entry"
    - button "Add Property"
    `)
    await page.getByRole("button", { name: "Preview File" }).click()
    await expect(page.locator("img")).toBeVisible()
})
