import { test, expect, Page } from "@playwright/test"

async function testCrateContent(page: Page) {
    await expect(page.locator("body")).toMatchAriaSnapshot(`
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
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - heading "Crate Root TestCrate" [level=2]:
      - button "Crate Root"
    - text: Name
    - paragraph: The name of the item.
    - textbox: TestCrate
    - button
    - button "Add another entry"
    - text: Date Created
    - paragraph: The date on which the CreativeWork was created or the item was added to a DataFeed.
    - textbox: /\\d+-\\d+-\\d+T\\d+:\\d+/
    - button
    - button "Add another entry"
    - text: Description
    - paragraph: A description of the item.
    - textbox: The Test Crate
    - button
    - button "Add another entry"
    - text: Has Part
    - paragraph: Indicates an item or CreativeWork that is part of this item, or CreativeWork (in some sense).
    - button "F JSON Result File result.json"
    - button
    - button
    - button "Add another entry"
    - text: Is Family Friendly
    - paragraph: Indicates whether this content is family friendly.
    - switch [checked]
    - text: "True"
    - button
    - switch
    - text: "False"
    - button
    - button "Add another entry"
    - text: Version
    - paragraph: The version of the CreativeWork embodied by a specified resource.
    - spinbutton: /\\d+/
    - button
    - textbox: v25.0.0
    - button
    - button "Add another entry"
    - button "Add Property"
    `)
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "Name"
    - button "Date Created"
    - button "Description"
    - button "Has Part"
    - button "Is Family Friendly"
    - button "Version"
    `)
    await page.getByRole("button", { name: "F JSON Result File result.json" }).click()
    await expect(page.getByRole("heading").getByText("JSON Result File")).toBeVisible()
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
}

test("Import Crate .zip", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import Crate (.zip)" }).click()
    await page.getByTestId("create-upload-input").setInputFiles("tests/data/TestCrate.zip")
    await testCrateContent(page)
})

test("Import Crate .eln", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import Crate (.zip)" }).click()
    await page.getByTestId("create-upload-input").setInputFiles("tests/data/TestCrate.eln")
    await testCrateContent(page)
})

test("Import Folder", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "New Crate" }).click()
    await page.getByRole("menuitem", { name: "Start with Data" }).click()
    await page.getByRole("button", { name: "Select Folder" }).click()
    await page.getByTestId("create-folder-upload-input").setInputFiles("tests/data/TestFolder")
    await page.getByRole("textbox", { name: "Description" }).click()
    await page.getByRole("textbox", { name: "Description" }).fill("Custom Description Text")
    await page.getByRole("textbox", { name: "Name" }).click()
    await page.getByRole("textbox", { name: "Name" }).fill("Uploaded from Folder")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "R Uploaded from FolderDataset"
    - button "Data Entities":
      - img
    - button "F candles-9247498_1280.jpgFile"
    - button "F description.txtFile"
    - button "F empty-fileFile"
    - button "F example.jsonFile"
    - button "Contextual Entities":
      - img
    `)
    await expect(page.getByRole("textbox").first()).toHaveValue("Uploaded from Folder")
    await expect(page.getByRole("textbox").nth(1)).toHaveValue("Custom Description Text")
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "F candles-9247498_1280.jpg img/candles-9247498_1280.jpg"
    - button
    - button
    - button "F description.txt description.txt"
    - button
    - button
    - button "F empty-file empty-file"
    - button
    - button
    - button "F example.json example.json"
    - button
    - button
    - button "Add another entry"
    `)
    await page.getByRole("button", { name: "File Explorer" }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "img":
      - img
    - button "candles-9247498_1280.jpgcandles-9247498_1280.jpg"
    - button "description.txtdescription.txt"
    - button "empty-fileempty-file"
    - button "example.jsonexample.json"
    - button "ro-crate-metadata.json"
    `)
    await page.getByRole("button", { name: "candles-9247498_1280." }).click()
    await expect(page.locator("body")).toMatchAriaSnapshot(`- text: img/candles-9247498_1280.jpg`)
    await page.getByRole("button", { name: "example.jsonexample.json" }).click()
    await expect(page.getByRole("code")).toContainText(
        '{ "file": "example.json", "contains": "nothing"}'
    )
    await page.getByRole("button", { name: "description.txtdescription.txt" }).click()
    await expect(page.getByRole("code")).toContainText("This is the Test Folder Crate")
})
