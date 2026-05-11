import { BrowserCrateService } from "@/lib/persistence/browser/BrowserCrateService"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"

type MockWorker = {
    [K in keyof FunctionWorker<typeof opfsFunctions>]: jest.Mock
}

function createMockWorker(): MockWorker {
    return {
        execute: jest.fn(),
        executeTransfer: jest.fn()
    } as unknown as MockWorker
}

const TEST_CRATE_ID = "test-crate-abc"

const sampleMetadata = JSON.stringify(
    {
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": [
            { "@id": "./", "@type": "Dataset", name: "Test" },
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                about: { "@id": "./" },
                conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" }
            }
        ]
    },
    null,
    2
)

describe("BrowserCrateService", () => {
    let worker: MockWorker
    let service: BrowserCrateService

    beforeEach(() => {
        worker = createMockWorker()
        service = new BrowserCrateService(
            TEST_CRATE_ID,
            worker as unknown as FunctionWorker<typeof opfsFunctions>
        )
    })

    describe("getMetadata", () => {
        it("should read ro-crate-metadata.json and return its text content", async () => {
            const blob = new Blob([sampleMetadata], { type: "application/json" })
            worker.execute.mockResolvedValue(blob)

            const result = await service.getMetadata()

            expect(worker.execute).toHaveBeenCalledWith(
                "readFile",
                TEST_CRATE_ID,
                "ro-crate-metadata.json"
            )
            expect(result).toBe(sampleMetadata)
        })

        it("should propagate errors from the worker", async () => {
            worker.execute.mockRejectedValue(new Error("File not found"))

            await expect(service.getMetadata()).rejects.toThrow("File not found")
        })
    })

    describe("setMetadata", () => {
        beforeEach(() => {
            // updateFile triggers emitQuotaChanged — stub getStorageInfo to avoid warnings
            worker.execute.mockImplementation(async (name: string) => {
                if (name === "getStorageInfo") {
                    return { usedSpace: 0, totalSpace: 1000, persistent: true }
                }
                return undefined
            })
        })

        it("should write metadata via the file service using writeFile", async () => {
            await service.setMetadata(sampleMetadata)

            expect(worker.execute).toHaveBeenCalledWith(
                "writeFile",
                TEST_CRATE_ID,
                "ro-crate-metadata.json",
                expect.any(Blob)
            )

            // Verify the Blob content matches the original metadata string
            const blob: Blob = worker.execute.mock.calls.find(
                ([fn]: [string]) => fn === "writeFile"
            )[3]
            expect(await blob.text()).toBe(sampleMetadata)
        })

        it("should emit metadata-changed event with the new metadata string", async () => {
            const listener = jest.fn()
            service.events.addEventListener("metadata-changed", listener)

            await service.setMetadata(sampleMetadata)

            expect(listener).toHaveBeenCalledWith(sampleMetadata)
            expect(listener).toHaveBeenCalledTimes(1)
        })

        it("should emit metadata-changed after the write completes, not before", async () => {
            const callOrder: string[] = []

            worker.execute.mockImplementation(async (name: string) => {
                if (name === "writeFile") callOrder.push("write")
                if (name === "getStorageInfo")
                    return { usedSpace: 0, totalSpace: 1000, persistent: true }
                return undefined
            })

            service.events.addEventListener("metadata-changed", () => {
                callOrder.push("event")
            })

            await service.setMetadata(sampleMetadata)

            expect(callOrder).toEqual(["write", "event"])
        })

        it("should not double-emit metadata-changed from the file-updated event", async () => {
            const listener = jest.fn()
            service.events.addEventListener("metadata-changed", listener)

            await service.setMetadata(sampleMetadata)

            expect(listener).toHaveBeenCalledTimes(1)
        })
    })

    describe("getFileService", () => {
        it("should return a file service instance", () => {
            const fileService = service.getFileService()
            expect(fileService).not.toBeNull()
        })

        it("should return the same file service instance on repeated calls", () => {
            const fs1 = service.getFileService()
            const fs2 = service.getFileService()
            expect(fs1).toBe(fs2)
        })
    })
})
