import { BrowserRepositoryService } from "@/lib/persistence/browser/BrowserRepositoryService"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"

type MockWorker = {
    [K in keyof FunctionWorker<typeof opfsFunctions>]: jest.Mock
}

function createMockWorker(): MockWorker {
    return {
        execute: jest.fn()
    } as unknown as MockWorker
}

describe("BrowserRepositoryService", () => {
    let worker: MockWorker
    let service: BrowserRepositoryService

    beforeEach(() => {
        worker = createMockWorker()
        service = new BrowserRepositoryService(
            worker as unknown as FunctionWorker<typeof opfsFunctions>
        )
    })

    describe("getCratesList", () => {
        it("should return stored crate objects from worker crate IDs", async () => {
            worker.execute.mockResolvedValue(["crate-1", "crate-2", "crate-3"])

            const result = await service.getCratesList()

            expect(worker.execute).toHaveBeenCalledWith("getCrates")
            expect(result).toEqual([
                { crateId: "crate-1", name: "crate-1", description: "", lastOpenedAt: null },
                { crateId: "crate-2", name: "crate-2", description: "", lastOpenedAt: null },
                { crateId: "crate-3", name: "crate-3", description: "", lastOpenedAt: null }
            ])
        })

        it("should return an empty array when no crates exist", async () => {
            worker.execute.mockResolvedValue([])

            const result = await service.getCratesList()

            expect(result).toEqual([])
        })

        it("should use the crateId as the name", async () => {
            worker.execute.mockResolvedValue(["my-unique-id"])

            const result = await service.getCratesList()

            expect(result[0].crateId).toBe("my-unique-id")
            expect(result[0].name).toBe("my-unique-id")
        })
    })

    describe("createCrateFromZip", () => {
        it("should pass the zip blob to the worker", async () => {
            const newCrateId = "new-crate-uuid"
            worker.execute.mockResolvedValue(newCrateId)

            const zipBlob = new Blob(["fake zip data"], { type: "application/zip" })
            await service.createCrateFromZip(zipBlob)

            expect(worker.execute).toHaveBeenCalledWith("createCrateFromZip", zipBlob)
        })

        it("should emit crate-created event with the new crate ID", async () => {
            const newCrateId = "new-crate-uuid"
            worker.execute.mockResolvedValue(newCrateId)

            const listener = jest.fn()
            service.events.addEventListener("crate-created", listener)

            await service.createCrateFromZip(new Blob())

            expect(listener).toHaveBeenCalledWith(newCrateId)
        })

        it("should emit crates-list-changed event", async () => {
            worker.execute.mockResolvedValue("new-id")

            const listener = jest.fn()
            service.events.addEventListener("crates-list-changed", listener)

            await service.createCrateFromZip(new Blob())

            expect(listener).toHaveBeenCalledTimes(1)
        })

        it("should emit crate-created before crates-list-changed", async () => {
            worker.execute.mockResolvedValue("new-id")

            const order: string[] = []
            service.events.addEventListener("crate-created", () => order.push("crate-created"))
            service.events.addEventListener("crates-list-changed", () =>
                order.push("crates-list-changed")
            )

            await service.createCrateFromZip(new Blob())

            expect(order).toEqual(["crate-created", "crates-list-changed"])
        })
    })

    describe("deleteCrate", () => {
        it("should delete the crate via the worker", async () => {
            worker.execute.mockResolvedValue(undefined)

            await service.deleteCrate("crate-to-delete")

            expect(worker.execute).toHaveBeenCalledWith("deleteCrateDir", "crate-to-delete")
        })

        it("should emit crate-deleted event with the crate ID", async () => {
            worker.execute.mockResolvedValue(undefined)

            const listener = jest.fn()
            service.events.addEventListener("crate-deleted", listener)

            await service.deleteCrate("crate-to-delete")

            expect(listener).toHaveBeenCalledWith("crate-to-delete")
        })

        it("should emit crates-list-changed event", async () => {
            worker.execute.mockResolvedValue(undefined)

            const listener = jest.fn()
            service.events.addEventListener("crates-list-changed", listener)

            await service.deleteCrate("crate-to-delete")

            expect(listener).toHaveBeenCalledTimes(1)
        })

        it("should emit crate-deleted before crates-list-changed", async () => {
            worker.execute.mockResolvedValue(undefined)

            const order: string[] = []
            service.events.addEventListener("crate-deleted", () => order.push("crate-deleted"))
            service.events.addEventListener("crates-list-changed", () =>
                order.push("crates-list-changed")
            )

            await service.deleteCrate("crate-to-delete")

            expect(order).toEqual(["crate-deleted", "crates-list-changed"])
        })
    })

    describe("getCrateAs", () => {
        it("should return a zip blob for format 'zip'", async () => {
            const zipBlob = new Blob(["zip data"], { type: "application/zip" })
            worker.execute.mockResolvedValue(zipBlob)

            const result = await service.getCrateAs("crate-1", "zip")

            expect(worker.execute).toHaveBeenCalledWith("createCrateZip", "crate-1")
            expect(result).toBe(zipBlob)
        })

        it("should return an eln blob for format 'eln'", async () => {
            const elnBlob = new Blob(["eln data"], { type: "application/vnd.eln+zip" })
            worker.execute.mockResolvedValue(elnBlob)

            const result = await service.getCrateAs("crate-1", "eln")

            expect(worker.execute).toHaveBeenCalledWith("createCrateEln", "crate-1")
            expect(result).toBe(elnBlob)
        })

        it("should return a JSON-LD blob for format 'standalone-json'", async () => {
            const metadataContent = '{"@context":"test","@graph":[]}'
            const metadataBlob = new Blob([metadataContent], { type: "application/json" })
            worker.execute.mockResolvedValue(metadataBlob)

            const result = await service.getCrateAs("crate-1", "standalone-json")

            expect(worker.execute).toHaveBeenCalledWith(
                "readFile",
                "crate-1",
                "ro-crate-metadata.json"
            )

            // Should be a new Blob with application/ld+json type
            expect(result).toBeInstanceOf(Blob)
            expect(result.type).toBe("application/ld+json")

            // Content should match the original metadata
            const text = await result.text()
            expect(text).toBe(metadataContent)
        })
    })

    describe("getStorageQuota", () => {
        it("should return storage quota from the worker", async () => {
            worker.execute.mockResolvedValue({
                usedSpace: 1024,
                totalSpace: 1048576,
                persistent: true
            })

            const quota = await service.getStorageQuota()

            expect(worker.execute).toHaveBeenCalledWith("getStorageInfo")
            expect(quota).toEqual({
                usedSpace: 1024,
                totalSpace: 1048576,
                persistent: true
            })
        })
    })
})
