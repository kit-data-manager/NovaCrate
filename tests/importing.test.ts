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
    - textbox: /\\d+-\\d+-05T14:\\d+/
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
    - text: File Name
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
    await page
        .getByRole("button", { name: "Select Folder" })
        .setInputFiles([
            ".DS_Store",
            "thesis.pdf",
            "pc-win-de-keyboard.dmg",
            "Bachelorarbeit_Inckmann_TypgebundeneOperationen-FDOs.pdf",
            "CodeResources",
            "Info.plist",
            "PkgInfo",
            "welcome-LogiOptionsPlus@2x.png",
            "privacy-policy-ja-jp.html",
            "welcome-LogiOptionsPlus.png",
            "privacy-policy-zh-cn.html",
            "eula-pl-pl.html",
            "DeviceImage1@2x.png",
            "privacy-policy-ko-kr.html",
            "privacy-policy-es-es.html",
            "eula-nb-no.html",
            "DeviceImage3@2x.png",
            "privacy-policy-pt-pt.html",
            "eula-da-dk.html",
            "CloseIcon.png",
            "privacy-policy-sv-se.html",
            "eula-de-de.html",
            "error@2x.png",
            "eula-pt-br.html",
            "styles.css",
            "BrownPro-Light.woff2",
            "eula-zh-tw.html",
            "eula-sr-sp.html",
            "eula-fr-fr.html",
            "IconWarning.png",
            "ExpanderUp.png",
            "logo.mp4",
            "DeviceImage5.png",
            "eula-ru-ru.html",
            "eula-nl-nl.html",
            "SendErrorLogsDialog.nib",
            "DeviceImage4.png",
            "eula-fi-fi.html",
            "eula-en-us.html",
            "privacy-policy-it-it.html",
            "DeviceImage1.tiff",
            "DeviceImage1.png",
            "DeviceImage3.png",
            "welcome-LogiOptionsPlus.tiff",
            "privacy-policy-el-gr.html",
            "DeviceImage5@2x.png",
            "DeviceImage2.png",
            "error.tiff",
            "privacy-policy-ru-ru.html",
            "MainMenu.nib",
            "privacy-policy-nl-nl.html",
            "DeviceImage2.tiff",
            "icon_kiros.icns",
            "ExpanderDown.png",
            "error.png",
            "app-installed.gif",
            "Unsupported-OS.gif",
            "DeviceImage3.tiff",
            "eula-el-gr.html",
            "privacy-policy-en-us.html",
            "eula-it-it.html",
            "privacy-policy-fi-fi.html",
            "DeviceImage2@2x.png",
            "EndUserModal.nib",
            "eula-ko-kr.html",
            "CrashReportDialog.nib",
            "BrownPro-Bold.woff2",
            "DeviceImage4.tiff",
            "eula-es-es.html",
            "spinner.png",
            "eula-ja-jp.html",
            "eula-zh-cn.html",
            "privacy-policy-pl-pl.html",
            "KIROSAlert.nib",
            "privacy-policy-pt-br.html",
            "DeviceImage4@2x.png",
            "privacy-policy-de-de.html",
            "privacy-policy-sr-sp.html",
            "privacy-policy-fr-fr.html",
            "privacy-policy-zh-tw.html",
            "privacy-policy-da-dk.html",
            "privacy-policy-nb-no.html",
            "eula-pt-pt.html",
            "DeviceImage5.tiff",
            "eula-sv-se.html",
            "BrownPro-Regular.woff2",
            "Localizable.strings",
            "InfoPlist.strings",
            "BrownLogitechPan-Black.otf",
            "BrownLogitechPan-Italic.otf",
            "BrownPro-Light.otf",
            "BrownPro-Regular.otf",
            "BrownLogitechPan-Bold.otf",
            "BrownPro-Bold.otf",
            "BrownPro-Thin.otf",
            "BrownLogitechPan-Thin.otf",
            "BrownLogitechPan-Medium.otf",
            "BrownLogitechPan-Regular.otf",
            "BrownLogitechPan-Light.otf",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "Localizable.strings",
            "InfoPlist.strings",
            "logioptionsplus_installer",
            "CodeResources"
        ])
    await page.getByRole("textbox", { name: "Name" }).click()
    await page.getByRole("textbox", { name: "Name" }).fill("My Test Crate")
    await page.getByRole("textbox", { name: "Name" }).press("Tab")
    await page.getByRole("textbox", { name: "Description" }).fill("My Test Description")
    await page.getByRole("textbox", { name: "Description" }).press("Enter")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByRole("heading").getByText("My Test Crate")).toBeVisible()
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button "F .DS_StoreFile"
    - button "F app-installed.gifFile"
    - button "F Bachelorarbeit_Inckmann_TypgebundeneOperationen-FDOs.pdfFile"
    - button "F BrownLogitechPan-Black.otfFile"
    - button "F BrownLogitechPan-Bold.otfFile"
    - button "F BrownLogitechPan-Italic.otfFile"
    - button "F BrownLogitechPan-Light.otfFile"
    - button "F BrownLogitechPan-Medium.otfFile"
    - button "F BrownLogitechPan-Regular.otfFile"
    - button "F BrownLogitechPan-Thin.otfFile"
    - button "F BrownPro-Bold.otfFile"
    - button "F BrownPro-Bold.woff2File"
    - button "F BrownPro-Light.otfFile"
    - button "F BrownPro-Light.woff2File"
    - button "F BrownPro-Regular.otfFile"
    - button "F BrownPro-Regular.woff2File"
    - button "F BrownPro-Thin.otfFile"
    - button "F CloseIcon.pngFile"
    - button "F CodeResourcesFile"
    - button "F CodeResourcesFile"
    - button "F CrashReportDialog.nibFile"
    - button "F DeviceImage1.pngFile"
    - button "F DeviceImage1.tiffFile"
    - button "F DeviceImage1@2x.pngFile"
    - button "F DeviceImage2.pngFile"
    - button "F DeviceImage2.tiffFile"
    - button "F DeviceImage2@2x.pngFile"
    - button "F DeviceImage3.pngFile"
    - button "F DeviceImage3.tiffFile"
    - button "F DeviceImage3@2x.pngFile"
    - button "F DeviceImage4.pngFile"
    - button "F DeviceImage4.tiffFile"
    - button "F DeviceImage4@2x.pngFile"
    - button "F DeviceImage5.pngFile"
    - button "F DeviceImage5.tiffFile"
    - button "F DeviceImage5@2x.pngFile"
    - button "F EndUserModal.nibFile"
    - button "F error.pngFile"
    - button "F error.tiffFile"
    - button "F error@2x.pngFile"
    - button "F eula-da-dk.htmlFile"
    - button "F eula-de-de.htmlFile"
    - button "F eula-el-gr.htmlFile"
    - button "F eula-en-us.htmlFile"
    - button "F eula-es-es.htmlFile"
    - button "F eula-fi-fi.htmlFile"
    - button "F eula-fr-fr.htmlFile"
    - button "F eula-it-it.htmlFile"
    - button "F eula-ja-jp.htmlFile"
    - button "F eula-ko-kr.htmlFile"
    - button "F eula-nb-no.htmlFile"
    - button "F eula-nl-nl.htmlFile"
    - button "F eula-pl-pl.htmlFile"
    - button "F eula-pt-br.htmlFile"
    - button "F eula-pt-pt.htmlFile"
    - button "F eula-ru-ru.htmlFile"
    - button "F eula-sr-sp.htmlFile"
    - button "F eula-sv-se.htmlFile"
    - button "F eula-zh-cn.htmlFile"
    - button "F eula-zh-tw.htmlFile"
    - button "F ExpanderDown.pngFile"
    - button "F ExpanderUp.pngFile"
    - button "F icon_kiros.icnsFile"
    - button "F IconWarning.pngFile"
    - button "F Info.plistFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F InfoPlist.stringsFile"
    - button "F KIROSAlert.nibFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F Localizable.stringsFile"
    - button "F logioptionsplus_installerFile"
    - button "F logo.mp4File"
    - button "F MainMenu.nibFile"
    - button "F pc-win-de-keyboard.dmgFile"
    - button "F PkgInfoFile"
    - button "F privacy-policy-da-dk.htmlFile"
    - button "F privacy-policy-de-de.htmlFile"
    - button "F privacy-policy-el-gr.htmlFile"
    - button "F privacy-policy-en-us.htmlFile"
    - button "F privacy-policy-es-es.htmlFile"
    - button "F privacy-policy-fi-fi.htmlFile"
    - button "F privacy-policy-fr-fr.htmlFile"
    - button "F privacy-policy-it-it.htmlFile"
    - button "F privacy-policy-ja-jp.htmlFile"
    - button "F privacy-policy-ko-kr.htmlFile"
    - button "F privacy-policy-nb-no.htmlFile"
    - button "F privacy-policy-nl-nl.htmlFile"
    - button "F privacy-policy-pl-pl.htmlFile"
    - button "F privacy-policy-pt-br.htmlFile"
    - button "F privacy-policy-pt-pt.htmlFile"
    - button "F privacy-policy-ru-ru.htmlFile"
    - button "F privacy-policy-sr-sp.htmlFile"
    - button "F privacy-policy-sv-se.htmlFile"
    - button "F privacy-policy-zh-cn.htmlFile"
    - button "F privacy-policy-zh-tw.htmlFile"
    - button "F SendErrorLogsDialog.nibFile"
    - button "F spinner.pngFile"
    - button "F styles.cssFile"
    - button "F thesis.pdfFile"
    - button "F Unsupported-OS.gifFile"
    - button "F welcome-LogiOptionsPlus.pngFile"
    - button "F welcome-LogiOptionsPlus.tiffFile"
    - button "F welcome-LogiOptionsPlus@2x.pngFile"
    `)
})
