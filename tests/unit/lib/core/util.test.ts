import { getFileAsURL, downloadBlob, downloadCrateAs } from "@/lib/core/util"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { Observable } from "@/lib/core/impl/Observable"

jest.mock("js-file-download", () => jest.fn())
import fileDownload from "js-file-download"

describe("getFileAsURL", () => {
    it("should create an object URL from the file blob", async () => {
        const blob = new Blob(["file content"], { type: "text/plain" })
        const fileService: IFileService = {
            events: new Observable(),
            getContentList: jest.fn(),
            getInfo: jest.fn(),
            getFile: jest.fn().mockResolvedValue(blob),
            addFile: jest.fn(),
            addFolder: jest.fn(),
            updateFile: jest.fn(),
            move: jest.fn(),
            delete: jest.fn(),
            getStorageQuota: jest.fn()
        }

        const createObjectURL = jest.fn().mockReturnValue("blob:mock-url")
        globalThis.URL.createObjectURL = createObjectURL

        const url = await getFileAsURL(fileService, "test.txt")

        expect(fileService.getFile).toHaveBeenCalledWith("test.txt")
        expect(createObjectURL).toHaveBeenCalledWith(blob)
        expect(url).toBe("blob:mock-url")
    })
})

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
