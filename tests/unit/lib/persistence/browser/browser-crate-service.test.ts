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
        it("should write metadata using executeTransfer with encoded data", async () => {
            worker.executeTransfer.mockResolvedValue(undefined)

            await service.setMetadata(sampleMetadata)

            expect(worker.executeTransfer).toHaveBeenCalledTimes(1)

            const [fnName, transferables, crateId, filePath, data] =
                worker.executeTransfer.mock.calls[0]
            expect(fnName).toBe("writeFile")
            expect(crateId).toBe(TEST_CRATE_ID)
            expect(filePath).toBe("ro-crate-metadata.json")
            expect(data).toBeInstanceOf(Uint8Array)

            // Verify the encoded data matches the original metadata
            const decoded = new TextDecoder().decode(data)
            expect(decoded).toBe(sampleMetadata)

            // Verify transferables includes the buffer
            expect(transferables).toHaveLength(1)
        })

        it("should emit metadata-changed event with the new metadata string", async () => {
            worker.executeTransfer.mockResolvedValue(undefined)

            const listener = jest.fn()
            service.events.addEventListener("metadata-changed", listener)

            await service.setMetadata(sampleMetadata)

            expect(listener).toHaveBeenCalledWith(sampleMetadata)
        })

        it("should emit metadata-changed after the write completes, not before", async () => {
            const callOrder: string[] = []

            worker.executeTransfer.mockImplementation(async () => {
                callOrder.push("write")
            })

            service.events.addEventListener("metadata-changed", () => {
                callOrder.push("event")
            })

            await service.setMetadata(sampleMetadata)

            expect(callOrder).toEqual(["write", "event"])
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
