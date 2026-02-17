import { test, expect } from "@playwright/test"

test("iframe integration", async ({ page }) => {
    await page.goto("http://localhost:3000/test/iframe")
    await page.getByRole("textbox", { name: "Metadata" }).click()
    await page
        .getByRole("textbox", { name: "Metadata" })
        .fill(
            '{"@context":"https://w3id.org/ro/crate/1.1/context","@graph":[{"@id":"./","@type":"Dataset","name":"Air quality measurements in Karlsruhe","description":"Ai measurements conducted in different places across Karlsruhe","datePublished":"2024","license":{"@id":"https://creativecommons.org/licenses/by/4.0/"},"hasPart":[{"@id":"map.pdf"},{"@id":"measurements/HVV%2520Anwesenheit%2520WiSe%25202526.pdf"}],"author":[{"@id":"creator"},{"@id":"#christopher%20raquet"}]},{"@type":"CreativeWork","@id":"ro-crate-metadata.json","conformsTo":{"@id":"https://w3id.org/ro/crate/1.1"},"about":{"@id":"./"}},{"@id":"map.pdf","@type":"File","name":"Map of measurements","description":"A map of all the location where the tests have been conducted","datePublished":"2021-10-22T00:00:00Z","encodingFormat":"application/pdf","author":{"@id":"creator"}},{"@id":"creator","@type":"Person","email":"john.doe@kit.edu","givenName":"John","familyName":"Doe","nationality":{"@id":"https://www.geonames.org/2921044"},"affiliation":{"@id":"https://www.geonames.org/7288147"}},{"@id":"https://creativecommons.org/licenses/by/4.0/","@type":"CreativeWork","name":"CC BY 4.0","description":"Creative Commons Attribution 4.0 International License"},{"@id":"https://www.geonames.org/2921044","@type":"Place","description":"Big country in central Europe."},{"@id":"#MeasurementCapture_23231","@type":"CreateAction","agent":{"@id":"creator"},"instrument":{"@id":"https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kit"}},{"@id":"kit_location","@type":"Place","geo":{"@id":"#4241434-33413"}},{"@id":"#4241434-33413","@type":"GeoCoordinates","latitude":"49.00944","longitude":"8.41167"},{"@id":"https://www.geonames.org/7288147","@type":"Organization","name":"Karlsruher Institut fuer Technologie","url":"https://www.kit.edu/","location":{"@id":"kit_location"}},{"@id":"https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kit","@type":"IndividualProduct","description":"The Outdoor Air Quality Test Kit (Starter) is for users who want an affordable set of tools to measure the common pollutants in ambient outdoor air."},{"@id":"measurements/HVV%2520Anwesenheit%2520WiSe%25202526.pdf","@type":"File","name":"HVV Anwesenheit WiSe 2526","contentSize":"225285","encodingFormat":"application/pdf"},{"name":"Christopher Raquet","@id":"#christopher%20raquet","@type":["Person"]}]}'
        )
    await expect(
        page.locator("iframe").contentFrame().locator(".animate-pulse.rounded-md.m-1").first()
    ).toBeVisible()
    await expect(
        page
            .locator("iframe")
            .contentFrame()
            .locator(".animate-pulse.rounded-md.w-32.h-8.bg-muted-foreground\\/30")
            .first()
    ).toBeVisible()
    await expect(
        page.locator("iframe").contentFrame().locator(".animate-pulse.rounded-md.bg-muted.h-10")
    ).toBeVisible()
    await expect(
        page
            .locator("iframe")
            .contentFrame()
            .locator(".animate-pulse.rounded-md.bg-muted.h-6")
            .first()
    ).toBeVisible()
    await expect(page.locator("#received-messages")).toMatchAriaSnapshot(
        `- text: "Received Messages: 0: READY"`
    )
    await page.getByRole("button", { name: "Load Crate" }).click()
    await expect(page.locator("iframe").contentFrame().locator('[id="_R_eslubtqlibu9fdb_"]'))
        .toMatchAriaSnapshot(`
    - text: Entities
    - button "Add new Entity"
    - button
    - button
    - button
    - button
    - button "R Air quality measurements in KarlsruheDataset"
    - button /Contextual Entities \\(\\d+\\)/:
      - img
      - text: ""
    - 'button /C #\\d+-33413GeoCoordinates/'
    - 'button "C #MeasurementCapture_23231CreateAction"'
    - button "C CC BY 4.0CreativeWork"
    - button "C Christopher RaquetPerson"
    - button "C https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kitIndividualProduct"
    - button "C https://www.geonames.org/2921044Place"
    - button "C John DoePerson"
    - button "C Karlsruher Institut fuer TechnologieOrganization"
    - button "C kit_locationPlace"
    - button "C ro-crate-metadata.jsonCreativeWork"
    - button "Data Entities (2)":
      - img
      - text: ""
    - button "F HVV Anwesenheit WiSe 2526File"
    - button "F Map of measurementsFile"
    `)
    await expect(
        page
            .locator("iframe")
            .contentFrame()
            .getByRole("heading")
            .getByText("Air quality measurements in")
    ).toBeVisible()

    await page
        .locator("iframe")
        .contentFrame()
        .locator("#single-property-editor-name-0")
        .getByRole("textbox")
        .click()
    await page
        .locator("iframe")
        .contentFrame()
        .locator("#single-property-editor-name-0")
        .getByRole("textbox")
        .press("ControlOrMeta+a")
    await page
        .locator("iframe")
        .contentFrame()
        .locator("#single-property-editor-name-0")
        .getByRole("textbox")
        .fill("Change the name")
    await expect(
        page.locator("iframe").contentFrame().getByRole("heading").getByText("Change the name")
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Update Crate" })).toBeVisible()
    await page.getByRole("button", { name: "Update Crate" }).click()
    await expect(
        page.locator("iframe").contentFrame().getByRole("heading").getByText("Change the name")
    ).toBeVisible()
    await page
        .getByRole("textbox", { name: "Metadata" })
        .fill(
            '{"@context":"https://w3id.org/ro/crate/1.1/context","@graph":[{"@id":"./","@type":"Dataset","name":"Overwrite the name","description":"Ai measurements conducted in different places across Karlsruhe","datePublished":"2024","license":{"@id":"https://creativecommons.org/licenses/by/4.0/"},"hasPart":[{"@id":"map.pdf"},{"@id":"measurements/HVV%2520Anwesenheit%2520WiSe%25202526.pdf"}],"author":[{"@id":"creator"},{"@id":"#christopher%20raquet"}]},{"@type":"CreativeWork","@id":"ro-crate-metadata.json","conformsTo":{"@id":"https://w3id.org/ro/crate/1.1"},"about":{"@id":"./"}},{"@id":"map.pdf","@type":"File","name":"Map of measurements","description":"A map of all the location where the tests have been conducted","datePublished":"2021-10-22T00:00:00Z","encodingFormat":"application/pdf","author":{"@id":"creator"}},{"@id":"creator","@type":"Person","email":"john.doe@kit.edu","givenName":"John","familyName":"Doe","nationality":{"@id":"https://www.geonames.org/2921044"},"affiliation":{"@id":"https://www.geonames.org/7288147"}},{"@id":"https://creativecommons.org/licenses/by/4.0/","@type":"CreativeWork","name":"CC BY 4.0","description":"Creative Commons Attribution 4.0 International License"},{"@id":"https://www.geonames.org/2921044","@type":"Place","description":"Big country in central Europe."},{"@id":"#MeasurementCapture_23231","@type":"CreateAction","agent":{"@id":"creator"},"instrument":{"@id":"https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kit"}},{"@id":"kit_location","@type":"Place","geo":{"@id":"#4241434-33413"}},{"@id":"#4241434-33413","@type":"GeoCoordinates","latitude":"49.00944","longitude":"8.41167"},{"@id":"https://www.geonames.org/7288147","@type":"Organization","name":"Karlsruher Institut fuer Technologie","url":"https://www.kit.edu/","location":{"@id":"kit_location"}},{"@id":"https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kit","@type":"IndividualProduct","description":"The Outdoor Air Quality Test Kit (Starter) is for users who want an affordable set of tools to measure the common pollutants in ambient outdoor air."},{"@id":"measurements/HVV%2520Anwesenheit%2520WiSe%25202526.pdf","@type":"File","name":"HVV Anwesenheit WiSe 2526","contentSize":"225285","encodingFormat":"application/pdf"},{"name":"Christopher Raquet","@id":"#christopher%20raquet","@type":["Person"]}]}'
        )
    await page.getByRole("button", { name: "Update Crate" }).click()
    await expect(
        page.locator("iframe").contentFrame().getByRole("heading").getByText("Overwrite the name")
    ).toBeVisible()
    await expect(page.locator("#received-messages")).toMatchAriaSnapshot(
        `- text: "Received Messages: 0: READY 1: CRATE_CHANGED 2: CRATE_CHANGED"`
    )
    await page.getByRole("button", { name: "Get Crate" }).click()
    await expect(page.locator("#received-messages")).toMatchAriaSnapshot(
        `- text: "Received Messages: 0: READY 1: CRATE_CHANGED 2: CRATE_CHANGED 3: GET_CRATE_RESPONSE"`
    )
    await page.getByRole("button", { name: "Use Example Metadata" }).click()
    await page.getByRole("button", { name: "Load Crate" }).click()
    await expect(
        page
            .locator("iframe")
            .contentFrame()
            .getByRole("heading")
            .getByText("Air quality measurements in")
    ).toBeVisible()
})
