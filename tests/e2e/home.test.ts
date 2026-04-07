import { test, expect } from "@playwright/test"

test("test", async ({ page }) => {
    await page.goto("http://localhost:3000/")
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - button
    - heading "NovaCrate" [level=1]
    - heading "Web-based editor for editing Research Object Crates" [level=2]
    - link "Open NovaCrate":
      - /url: /editor
      - button "Open NovaCrate"
    - text: NovaCrate is free and open-source (Apache-2.0 license) NovaCrate is a web-based interactive editor for editing, visualizing and validating Research Object Crates directly in the browser. Easily create RO-Crates describing your research data and export to a variety of file-formats. Check out some key features of NovaCrate below. Feature Overview
    - link "Entity Editor":
      - /url: "#entity-editor"
    - link "File Explorer":
      - /url: "#file-explorer"
    - link "Metadata Graph":
      - /url: "#metadata-graph"
    - text: JSON Editor Context Editor ELN Support
    - link "Live Validation":
      - /url: "#validation"
    - link "Custom Schemas":
      - /url: "#configuration"
    - link "Open Source":
      - /url: https://github.com/kit-data-manager/NovaCrate
    - text: Core Features of NovaCrate
    - img "NovaCrate Editor capabilities showcase"
    - heading "Entity Editor" [level=3]
    - paragraph: The main strength of NovaCrate is its usability-focused entity editing approach. The entity browser and the global search make it easy to find the entity you want to work on. The entities you are currently working on are displayed in a tabbed interface, so you can quickly switch between the entities you are working on.
    - paragraph: To ease the learning curve for beginners, rich property descriptions and type checks are included. Each property provides input fields that match their expected value. Referential properties automatically restrict the reference to matching target entities.
    - paragraph: While describing your research data, you can open a preview of any file in the crate on the right side of the editor, allowing you to easily integrate information already present in your research data.
    - paragraph: "Tip: While working on an entity, NovaCrate will show you which properties have been added, removed or modified using colored highlights."
    - heading "Integrated File Explorer" [level=3]
    - paragraph: NovaCrate provides an in-app file explorer that lets you view the contents of your Research Object Crate through a file-tree. You can preview files in your RO-Crate through a double-click (only supported for some common file formats). The file explorer allows easily uploading new files to the crate, as well as renaming or removing files and folders in the crate in case of errors or mistakes.
    - paragraph: To help you keep track of your metadata, a toggle at the top of the file explorer allows displaying the links between your research data and associated metadata. This way, you can directly see which metadata entities correspond to your research files and folders, while also allowing you to directly create matching metadata entities for files or folders that are not described yet.
    - paragraph: "Tip: You can view some supported file types directly in the editor, which can be very handy when manually extracting metadata from, e.g., a PDF file."
    - img "NovaCrate File Explorer capabilities showcase"
    - img "NovaCrate Graph capabilities showcase"
    - heading "Metadata Graph" [level=3]
    - paragraph: As the metadata within a Research Object Crate is organised in the JSON Linked Data format, the references between metadata entities are of great importance. NovaCrate provides a graph-visualization of the references between the metadata entities of your crate. This allows you to instantly understand the structure of your metadata, and find possible issues or potential for reuse.
    - paragraph: Furthermore, the Metadata Graph is interactive. By simply dragging-and-dropping between the connection ports of the metadata entities, you can create new references or edit existing ones. You can also add new properties to your metadata entities, matching the reference that you draw between metadata entities.
    - paragraph: "Tip: You can drag-and-drop new connections between entities or remove existing ones directly in the graph."
    - link "Open NovaCrate":
      - /url: /editor
      - button "Open NovaCrate"
    - heading "Validation" [level=3]
    - paragraph: NovaCrate implements numerous validation rules to make sure the Research Object Crate you work on is conformant to the current specification and follows best practices. Validation issues are reported in a granular manner directly where they occur - either on Crate-level, Entity-level or Property-level, removing the need for guessing where an issue has occurred.
    - paragraph: In addition to the best-practice-validation, NovaCrate also validates if the references between your metadata entities are valid, and if there are any properties present with invalid values.
    - paragraph: "Tip: Validation may be incomplete or inconsistent. You can disable the validation in the settings."
    - img "NovaCrate Validation capabilities showcase"
    - img "NovaCrate Configuration capabilities showcase"
    - heading "Configuration" [level=3]
    - text: The underlying schemas used for type inference and validation can be configured on the fly. By setting a download URL for a schema in the JSON-LD or Turtle file format, the corresponding types directly become available in the editor. Note that you have to take care of maintaining a proper JSON-LD context in your crate by yourself - if you extend the default context.
    - paragraph: "Tip: Schemas are loaded on-demand, only when they are needed."
    - heading "Quickstart" [level=3]
    - text: Ready to try out NovaCrate? Take a look at some of the examples in the main menu, by clicking the Quickstart button. NovaCrate is open-source and free to use, licensed under the Apache-2.0 license. All data stays on your device.
    - paragraph: "Tip: Feel free to bring your own RO-Crate to try out NovaCrate!"
    - img "NovaCrate Quickstart capabilities showcase"
    - link "Open NovaCrate":
      - /url: /editor
      - button "Open NovaCrate"
    - text: RO-Crates used as examples on this page are
    - link "eLabFTW examples":
      - /url: https://github.com/TheELNConsortium/TheELNFileFormat/tree/master/examples/elabftw
    - text: (MIT license) as well as the
    - link "RO-Crate Specification v1.2 JSON-LD":
      - /url: https://www.researchobject.org/ro-crate/specification/1.2/index.html
    - text: (Apache-2.0 license) Frequently Asked Questions
    - button "Where is my data stored?"
    - button "What has changed in the last update?"
    - button "How can I get in contact?"
    - button "Who is developing, maintaining, and hosting NovaCrate?"
    - button "Which Research Object Crate versions does NovaCrate support?"
    - button "Can I host NovaCrate on my own server?"
    - button "Is NovaCrate extensible?"
    - button "Can I integrate NovaCrate into my application/workflow/repository?"
    - text: /NovaCrate v\\d+\\.\\d+\\.\\d+/
    - link "GitHub logo":
      - /url: https://github.com/kit-data-manager/NovaCrate
      - img "GitHub logo"
    - link:
      - /url: https://www.kit.edu/privacypolicy.php
    - link:
      - /url: https://www.kit.edu/legals.php
    - text: /© \\d+ Karlsruhe Institute of Technology \\(KIT\\)/
    `)
    await page.getByRole("button", { name: "Where is my data stored?" }).click()
    await expect(page.getByText("All data stays on your local")).toBeVisible()
})
