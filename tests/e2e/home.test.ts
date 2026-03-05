import { test, expect } from "@playwright/test"

test("test", async ({ page }) => {
    await page.goto("http://localhost:3000/")
    await expect(page.locator("body")).toMatchAriaSnapshot(`
    - text: Check out some key features of NovaCrate below
    - img "NovaCrate Editor capabilities showcase"
    - heading "Editor" [level=3]
    - paragraph: The main strength of NovaCrate is it's usability-focused entity editing approach. The entity browser and the global search make it easy to find the entity you want to work on. The entities you are currently working on are displayed in a tabbed interface, so you can quickly switch between the parts you are working on. Property descriptions and type checking are also provided.
    - paragraph: "Tip: While working on an entity, NovaCrate will show you which properties have been added, removed or modified using colored highlights."
    - heading "File Explorer" [level=3]
    - paragraph: The general purpose of an RO-Crate is to package research data together with its metadata. To efficiently make use of RO-Crates, NovaCrate provides an in-app file explorer to inspect and change the contents of your crate.
    - paragraph: "Tip: You can view some supported file types directly in the editor, which can be very handy when manually extracting metadata from a PDF file for example."
    - img "NovaCrate File Explorer capabilities showcase"
    - img "NovaCrate Graph capabilities showcase"
    - heading "Graph" [level=3]
    - paragraph: RO-Crates use JSON-LD as the underlying file type to describe their metadata. This linked-data approach can naturally be visualized using a graph. NovaCrate provides a graph view to make it easy to see the relationships between your entities.
    - paragraph: "Tip: You can drag-and-drop new connections between entities or remove existing ones directly in the graph."
    - link "Open NovaCrate":
      - /url: /editor
      - button "Open NovaCrate"
    - heading "Validation" [level=3]
    - paragraph: NovaCrate implements numerous validation rules to make sure the RO-Crate you work on is conformant to the specification. While there are certainly many more rules to add, the current set already allows catching some common mistakes.
    - paragraph: "Tip: Validation may be incomplete or inconsistent. You can disable the validation in the settings."
    - img "NovaCrate Validation capabilities showcase"
    - img "NovaCrate Configuration capabilities showcase"
    - heading "Configuration" [level=3]
    - paragraph: The underlying schemas used for type inference and validation can be configured on the fly. By setting a download URL for a schema in the JSON-LD or Turtle file format, the corresponding types directly become available in the editor. Note that you have to take care of maintaining a proper JSON-LD context in your crate by yourself - if you extend the default context.
    - paragraph: "Tip: Schemas are loaded on-demand, only when they are needed."
    - heading "Quickstart" [level=3]
    - paragraph: Ready to try out NovaCrate? Simply use the Quickstart button at the top of the main menu after opening NovaCrate.
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
    `)
})
