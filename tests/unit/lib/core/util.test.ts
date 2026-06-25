import { downloadBlob, downloadCrateAs } from "@/lib/core/util"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { Observable } from "@/lib/core/impl/Observable"

jest.mock("js-file-download", () => jest.fn())
import fileDownload from "js-file-download"

describe("downloadBlob", () => {
    it("should trigger a download using js-file-download", () => {
        const blob = new Blob(["data"], { type: "application/zip" })

        downloadBlob(blob, "export.zip")

        expect(fileDownload).toHaveBeenCalledWith(blob, "export.zip")
    })
})

describe("downloadCrateAs", () => {
    it("should fetch the crate in the requested format and trigger a download", async () => {
        const blob = new Blob(["zip data"], { type: "application/zip" })
        const repo: IRepositoryService = {
            events: new Observable(),
            getCratesList: jest.fn(),
            createCrateFromZip: jest.fn(),
            createCrateFromMetadata: jest.fn(),
            deleteCrate: jest.fn(),
            getCrateAs: jest.fn().mockResolvedValue(blob),
            getStorageQuota: jest.fn()
        }

        await downloadCrateAs(repo, "crate-1", "zip", "my-crate.zip")

        expect(repo.getCrateAs).toHaveBeenCalledWith("crate-1", "zip")
        expect(fileDownload).toHaveBeenCalledWith(blob, "my-crate.zip")
    })
})
