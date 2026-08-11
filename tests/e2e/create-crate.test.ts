import { test, expect } from "@playwright/test"

test("Create Crate from Scratch", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "New RO-Crate" }).click()
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

test("Quickstart", async ({ page }) => {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Quickstart" }).click()
    await page.getByRole("menuitem", { name: "RO-Crate Specification Crate" }).click()
    await expect(
        page.getByRole("heading").getByText("RO-Crate specification dataset")
    ).toBeVisible()
    await expect(page.locator("#entity-browser-content")).toMatchAriaSnapshot(`
    - button "R RO-Crate specification datasetDataset"
    - button /Contextual Entities \\(\\d+\\)/
    - button "C A lightweight approach to research object data packagingScholarly Article"
    - 'button "C A lightweight approach to research object... - Stian Soiland-Reyes - OBF: BOSC - ISMB ECCB 2019Video Object"'
    - button "C About this documentWeb Page, Creative Work"
    - button "C Acrobat PDF 1.4 - Portable Document FormatThing"
    - button "C Alan R WilliamsPerson"
    - button "C Alasdair J. G. GrayPerson"
    - button "C Alexander KanitzPerson"
    - button "C Ana TrisovicPerson"
    - button "C Andreas CzerniakPerson"
    - button "C Apache License 2.0Creative Work"
    - button "C AppendixWeb Page, Creative Work"
    - button "C BaselPlace"
    - button "C Bert DroesbekePerson"
    - button "C Bioinformatics Open Source Conference 2019Publication Event"
    - button "C Björn GrüningPerson"
    - button "C brandon whiteheadPerson"
    - button "C Carole GoblePerson"
    - button "C Cedric DecruwPerson"
    - button "C ChangelogWeb Page, Creative Work"
    - button "C Chenxu NiuPerson"
    - button "C Contextual EntitiesWeb Page, Creative Work"
    - button "C Creative Commons Zero v1.0 UniversalCreative Work"
    - button "C Daniel GarijoPerson"
    - button "C Data EntitiesWeb Page, Creative Work"
    - button "C Data SciencePeriodical"
    - button "C Douglas LowePerson"
    - button "C Eoghan Ó CarragáinPerson"
    - button "C Erich BremerPerson"
    - button "C Finn BacallPerson"
    - button "C Frederik CoppensPerson"
    - button "C Gavin KennedyPerson"
    - button "C Giacomo TartariPerson"
    - button "C Handling relative URI referencesWeb Page, Creative Work"
    - button "C Hervé MénagerPerson"
    - button "C Hypertext Markup Language 5Thing"
    - button "C Ignacio EguinoaPerson"
    - button "C Implementation notesWeb Page, Creative Work"
    - button "C IntroductionWeb Page, Creative Work"
    - button "C ISMB ECCB 2019Publication Event"
    - button "C Jason A. ClarkPerson"
    - button "C Jasper KoehorstPerson"
    - button "C Jeremy JayPerson"
    - button "C Jose Manuel Gomez-PerezPerson"
    - button "C José María FernándezPerson"
    - button "C Karl SebbyPerson"
    - button "C Kosuke TanabePerson"
    - button "C Kristi HolmesPerson"
    - button "C Kyle ChardPerson"
    - button "C Laura Rodríguez-NavasPerson"
    - button "C Leyla Jael CastroPerson"
    - button "C Marc PortierPerson"
    - button "C Marco La RosaPerson"
    - button "C Mark GravesPerson"
    - button "C Mark WilkinsonPerson"
    - button "C Mercè CrosasPerson"
    - button "C Metadata of the RO-CrateWeb Page, Creative Work"
    - button "C Michael R CrusoePerson"
    - button "C Milan OjsteršekPerson"
    - button "C Muhammad RadifarPerson"
    - button "C Nick JutyPerson"
    - button "C Oscar CorchoPerson"
    - button "C Packaging research artefacts with RO-CrateScholarly Article"
    - button "C Paul BrackPerson"
    - button "C Paul GrothPerson"
    - button "C Paul WalkPerson"
    - button "C Peter SeftonPerson"
    - button "C Provenance of entitiesWeb Page, Creative Work"
    - button "C Raul PalmaPerson"
    - button "C Research Object Crate (RO-Crate) websiteWeb Site"
    - button "C ResearchObject.orgOrganization"
    - button "C RO-Crate CommunityProject"
    - button "C RO-Crate JSON-LDWeb Page, Creative Work"
    - button "C RO-Crate Metadata Specification 1.1 (PDF)Creative Work"
    - button "C RO-Crate Metadata Specification 1.1 (single-page HTML)Creative Work"
    - button "C RO-Crate StructureWeb Page, Creative Work"
    - button "C ro-crate-metadata.jsonCreative Work"
    - button "C Ronald SiebesPerson"
    - button "C Root Data EntityWeb Page, Creative Work"
    - button "C Salvador Capella-GutierrezPerson"
    - button "C Sergio SerraPerson"
    - button "C Shady El DamatyPerson"
    - button "C Shaun de WittPerson"
    - button "C Simone LeoPerson"
    - button "C Stian Soiland-ReyesPerson"
    - button "C Stuart OwenPerson"
    - button "C Sveinung GundersenPerson"
    - button "C TerminologyWeb Page, Creative Work"
    - button "C Thomas ThelenPerson"
    - button "C Tomasz MiksaPerson"
    - button "C Workflows and scriptsWeb Page, Creative Work"
    - button "C Xuanqi LiPerson"
    - button "Data Entities (3)"
    - button "D Packaging research artefacts with RO-Crate (RO-Crate)Dataset"
    - button "F RO-Crate JSON-LD ContextFile"
    - button "F RO-Crate Metadata Specification 1.1Creative Work, File"
    `)
})
