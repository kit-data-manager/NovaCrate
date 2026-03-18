import { BrowserFileService } from "@/lib/persistence/browser/BrowserFileService"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"
import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"

type MockWorker = {
    [K in keyof FunctionWorker<typeof opfsFunctions>]: jest.Mock
}

function createMockWorker(): MockWorker {
    return {
        execute: jest.fn()
    } as unknown as MockWorker
}

const TEST_CRATE_ID = "test-crate-xyz"

describe("BrowserFileService", () => {
    let worker: MockWorker
    let service: BrowserFileService

    beforeEach(() => {
        worker = createMockWorker()
        service = new BrowserFileService(
            TEST_CRATE_ID,
            worker as unknown as FunctionWorker<typeof opfsFunctions>
        )
    })

    describe("getContentList", () => {
        it("should return file entries from the worker", async () => {
            worker.execute.mockResolvedValue(["file1.txt", "file2.json"])

            const result = await service.getContentList()

            expect(worker.execute).toHaveBeenCalledWith("getCrateDirContents", TEST_CRATE_ID)
            expect(result).toEqual([
                { type: "file", name: "file1.txt", path: "file1.txt" },
                { type: "file", name: "file2.json", path: "file2.json" }
            ])
        })

        it("should recognize directories by trailing slash", async () => {
            worker.execute.mockResolvedValue(["images/", "data/"])

            const result = await service.getContentList()

            expect(result).toEqual([
                { type: "directory", name: "images", path: "images/" },
                { type: "directory", name: "data", path: "data/" }
            ])
        })

        it("should handle mixed files and directories", async () => {
            worker.execute.mockResolvedValue([
                "readme.md",
                "images/",
                "data/measurements.csv",
                "src/components/"
            ])

            const result = await service.getContentList()

            expect(result).toEqual([
                { type: "file", name: "readme.md", path: "readme.md" },
                { type: "directory", name: "images", path: "images/" },
                { type: "file", name: "measurements.csv", path: "data/measurements.csv" },
                { type: "directory", name: "components", path: "src/components/" }
            ])
        })

        it("should return an empty array when the crate has no contents", async () => {
            worker.execute.mockResolvedValue([])

            const result = await service.getContentList()

            expect(result).toEqual([])
        })

        it("should extract name from nested paths", async () => {
            worker.execute.mockResolvedValue(["deep/nested/file.txt", "deep/nested/folder/"])

            const result = await service.getContentList()

            expect(result).toEqual([
                { type: "file", name: "file.txt", path: "deep/nested/file.txt" },
                { type: "directory", name: "folder", path: "deep/nested/folder/" }
            ])
        })
    })

    describe("getInfo", () => {
        it("should return file info from the worker", async () => {
            worker.execute.mockResolvedValue({ type: "file", name: "test.txt" })

            const result = await service.getInfo("test.txt")

            expect(worker.execute).toHaveBeenCalledWith("getFileInfo", TEST_CRATE_ID, "test.txt")
            expect(result).toEqual({ type: "file", name: "test.txt", path: "test.txt" })
        })

        it("should return directory info", async () => {
            worker.execute.mockResolvedValue({ type: "directory", name: "images" })

            const result = await service.getInfo("images/")

            expect(result).toEqual({ type: "directory", name: "images", path: "images/" })
        })
    })

    describe("getFile", () => {
        it("should return a Blob from the worker", async () => {
            const blob = new Blob(["file content"], { type: "text/plain" })
            worker.execute.mockResolvedValue(blob)

            const result = await service.getFile("test.txt")

            expect(worker.execute).toHaveBeenCalledWith("readFile", TEST_CRATE_ID, "test.txt")
            expect(result).toBe(blob)
        })
    })

    describe("addFile", () => {
        beforeEach(() => {
            // Default: getStorageInfo resolves so emitQuotaChanged doesn't throw
            worker.execute.mockImplementation(async (name: string, ...args: any[]) => {
                if (name === "getStorageInfo") {
                    return { usedSpace: 100, totalSpace: 1000, persistent: true }
                }
                return undefined
            })
        })

        it("should write the file via the worker", async () => {
            const content = new Blob(["hello"])

            await service.addFile("test.txt", content)

            expect(worker.execute).toHaveBeenCalledWith(
                "writeFile",
                TEST_CRATE_ID,
                "test.txt",
                content
            )
        })

        it("should emit file-created event with the path", async () => {
            const listener = jest.fn()
            service.events.addEventListener("file-created", listener)

            await service.addFile("test.txt", new Blob(["hello"]))

            expect(listener).toHaveBeenCalledWith("test.txt")
        })

        it("should emit quota-changed event after adding", async () => {
            const listener = jest.fn()
            service.events.addEventListener("quota-changed", listener)

            await service.addFile("test.txt", new Blob(["hello"]))

            expect(listener).toHaveBeenCalledWith({
                usedSpace: 100,
                totalSpace: 1000,
                persistent: true
            })
        })
    })

    describe("addFolder", () => {
        it("should create the folder via the worker", async () => {
            worker.execute.mockResolvedValue(undefined)

            await service.addFolder("images")

            expect(worker.execute).toHaveBeenCalledWith("createFolder", TEST_CRATE_ID, "images")
        })

        it("should emit folder-created event with the path", async () => {
            worker.execute.mockResolvedValue(undefined)
            const listener = jest.fn()
            service.events.addEventListener("folder-created", listener)

            await service.addFolder("images")

            expect(listener).toHaveBeenCalledWith("images")
        })

        it("should not emit quota-changed event", async () => {
            worker.execute.mockResolvedValue(undefined)
            const listener = jest.fn()
            service.events.addEventListener("quota-changed", listener)

            await service.addFolder("images")

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe("updateFile", () => {
        beforeEach(() => {
            worker.execute.mockImplementation(async (name: string) => {
                if (name === "getStorageInfo") {
                    return { usedSpace: 200, totalSpace: 1000, persistent: true }
                }
                return undefined
            })
        })

        it("should write the file via the worker", async () => {
            const content = new Blob(["updated content"])

            await service.updateFile("test.txt", content)

            expect(worker.execute).toHaveBeenCalledWith(
                "writeFile",
                TEST_CRATE_ID,
                "test.txt",
                content
            )
        })

        it("should emit file-updated event with the path", async () => {
            const listener = jest.fn()
            service.events.addEventListener("file-updated", listener)

            await service.updateFile("test.txt", new Blob(["updated"]))

            expect(listener).toHaveBeenCalledWith("test.txt")
        })

        it("should emit quota-changed event after updating", async () => {
            const listener = jest.fn()
            service.events.addEventListener("quota-changed", listener)

            await service.updateFile("test.txt", new Blob(["updated"]))

            expect(listener).toHaveBeenCalled()
        })
    })

    describe("move", () => {
        it("should move a file via the worker", async () => {
            worker.execute.mockResolvedValue(undefined)

            await service.move("old.txt", "new.txt")

            expect(worker.execute).toHaveBeenCalledWith(
                "moveFileOrFolder",
                TEST_CRATE_ID,
                "old.txt",
                "new.txt"
            )
        })

        it("should emit file-moved for files (no trailing slash)", async () => {
            worker.execute.mockResolvedValue(undefined)
            const listener = jest.fn()
            service.events.addEventListener("file-moved", listener)

            await service.move("old.txt", "new.txt")

            expect(listener).toHaveBeenCalledWith("new.txt")
        })

        it("should emit folder-moved for folders (trailing slash on source)", async () => {
            worker.execute.mockResolvedValue(undefined)
            const folderListener = jest.fn()
            const fileListener = jest.fn()
            service.events.addEventListener("folder-moved", folderListener)
            service.events.addEventListener("file-moved", fileListener)

            await service.move("old-folder/", "new-folder/")

            expect(folderListener).toHaveBeenCalledWith("new-folder/")
            expect(fileListener).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        beforeEach(() => {
            worker.execute.mockImplementation(async (name: string) => {
                if (name === "getStorageInfo") {
                    return { usedSpace: 50, totalSpace: 1000, persistent: true }
                }
                return undefined
            })
        })

        it("should delete a file via the worker", async () => {
            await service.delete("test.txt")

            expect(worker.execute).toHaveBeenCalledWith(
                "deleteFileOrFolder",
                TEST_CRATE_ID,
                "test.txt"
            )
        })

        it("should emit file-deleted for files (no trailing slash)", async () => {
            const listener = jest.fn()
            service.events.addEventListener("file-deleted", listener)

            await service.delete("test.txt")

            expect(listener).toHaveBeenCalledWith("test.txt")
        })

        it("should emit folder-deleted for folders (trailing slash)", async () => {
            const folderListener = jest.fn()
            const fileListener = jest.fn()
            service.events.addEventListener("folder-deleted", folderListener)
            service.events.addEventListener("file-deleted", fileListener)

            await service.delete("images/")

            expect(folderListener).toHaveBeenCalledWith("images/")
            expect(fileListener).not.toHaveBeenCalled()
        })

        it("should emit quota-changed event after deleting", async () => {
            const listener = jest.fn()
            service.events.addEventListener("quota-changed", listener)

            await service.delete("test.txt")

            expect(listener).toHaveBeenCalled()
        })
    })

    describe("getStorageQuota", () => {
        it("should return storage quota from the worker", async () => {
            worker.execute.mockResolvedValue({
                usedSpace: 500,
                totalSpace: 10000,
                persistent: false
            })

            const quota = await service.getStorageQuota()

            expect(worker.execute).toHaveBeenCalledWith("getStorageInfo")
            expect(quota).toEqual({
                usedSpace: 500,
                totalSpace: 10000,
                persistent: false
            })
        })
    })

    describe("emitQuotaChanged error handling", () => {
        it("should not propagate errors from quota fetch after addFile", async () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
            worker.execute.mockImplementation(async (name: string) => {
                if (name === "getStorageInfo") {
                    throw new Error("Storage API unavailable")
                }
                return undefined
            })

            // addFile should succeed even if quota fetch fails
            await expect(service.addFile("test.txt", new Blob(["content"]))).resolves.not.toThrow()

            expect(warnSpy).toHaveBeenCalled()
            warnSpy.mockRestore()
        })

        it("should not propagate errors from quota fetch after delete", async () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
            worker.execute.mockImplementation(async (name: string) => {
                if (name === "getStorageInfo") {
                    throw new Error("Storage API unavailable")
                }
                return undefined
            })

            await expect(service.delete("test.txt")).resolves.not.toThrow()

            warnSpy.mockRestore()
        })
    })
})
