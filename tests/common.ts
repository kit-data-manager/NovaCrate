import { Page } from "@playwright/test"

export async function loadTestFolder(page: Page) {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import Crate (.zip)" }).click()
    await page.getByTestId("create-upload-input").setInputFiles("tests/data/TestFolder.zip")
}

export async function loadTestCrate(page: Page) {
    await page.goto("http://localhost:3000/editor")
    await page.getByRole("button", { name: "Import Crate (.zip)" }).click()
    await page.getByTestId("create-upload-input").setInputFiles("tests/data/TestCrate.zip")
}
