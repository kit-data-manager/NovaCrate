import { PersistenceAdapterImpl } from "@/lib/core/impl/PersistenceAdapterImpl"
import { Observable } from "@/lib/core/impl/Observable"
import { ICrateService, ICrateServiceEvents } from "@/lib/core/persistence/ICrateService"

const testCrateMetadata: ICrate = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": [
        {
            "@id": "./",
            "@type": "Dataset",
            name: "TestCrate",
            description: "The Test Crate",
            hasPart: [{ "@id": "result.json" }]
        },
        {
            about: { "@id": "./" },
            conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" },
            "@id": "ro-crate-metadata.json",
            "@type": "CreativeWork"
        },
        {
            "@id": "result.json",
            "@type": "File",
            name: "JSON Result File"
        }
    ]
}

function createMockCrateService(): ICrateService & {
    _events: Observable<ICrateServiceEvents>
    _metadata: string
} {
    const events = new Observable<ICrateServiceEvents>()
    let metadata = JSON.stringify(testCrateMetadata, null, 2)

    return {
        _events: events,
        get _metadata() {
            return metadata
        },
        set _metadata(value: string) {
            metadata = value
        },
        events,
        getMetadata: jest.fn(async () => metadata),
        setMetadata: jest.fn(async (newMetadata: string) => {
            metadata = newMetadata
        }),
        getFileService: jest.fn(() => null)
    }
}

describe("PersistenceAdapterImpl", () => {
    let mockCrateService: ReturnType<typeof createMockCrateService>
    let adapter: PersistenceAdapterImpl

    beforeEach(() => {
        mockCrateService = createMockCrateService()
        adapter = new PersistenceAdapterImpl(mockCrateService)
    })

    describe("getMetadataGraph", () => {
        it("should return the @graph array from the crate metadata", async () => {
            const graph = await adapter.getMetadataGraph()
            expect(graph).toEqual(testCrateMetadata["@graph"])
            expect(mockCrateService.getMetadata).toHaveBeenCalled()
        })

        it("should return entities with correct structure", async () => {
            const graph = await adapter.getMetadataGraph()
            const root = graph.find((e) => e["@id"] === "./")
            expect(root).toBeDefined()
            expect(root!["@type"]).toBe("Dataset")
            expect(root!.name).toBe("TestCrate")
        })
    })

    describe("getMetadataContext", () => {
        it("should return the @context from the crate metadata", async () => {
            const context = await adapter.getMetadataContext()
            expect(context).toBe("https://w3id.org/ro/crate/1.1/context")
        })
    })

    describe("updateMetadataGraph", () => {
        it("should update the graph in the crate metadata while preserving context", async () => {
            const newGraph: IEntity[] = [{ "@id": "./", "@type": "Dataset", name: "Updated" }]
            await adapter.updateMetadataGraph(newGraph)

            expect(mockCrateService.setMetadata).toHaveBeenCalled()
            const savedRaw = (mockCrateService.setMetadata as jest.Mock).mock.calls[0][0]
            const saved = JSON.parse(savedRaw)
            expect(saved["@graph"]).toEqual(newGraph)
            expect(saved["@context"]).toBe("https://w3id.org/ro/crate/1.1/context")
        })
    })

    describe("updateMetadataContext", () => {
        it("should update the context in the crate metadata while preserving graph", async () => {
            const newContext = "https://w3id.org/ro/crate/1.2/context"
            await adapter.updateMetadataContext(newContext)

            expect(mockCrateService.setMetadata).toHaveBeenCalled()
            const savedRaw = (mockCrateService.setMetadata as jest.Mock).mock.calls[0][0]
            const saved = JSON.parse(savedRaw)
            expect(saved["@context"]).toBe(newContext)
            expect(saved["@graph"]).toEqual(testCrateMetadata["@graph"])
        })

        it("should support object-style contexts", async () => {
            const newContext = {
                "@vocab": "https://w3id.org/ro/crate/1.2/context",
                custom: "https://example.org/"
            }
            await adapter.updateMetadataContext(newContext)

            const savedRaw = (mockCrateService.setMetadata as jest.Mock).mock.calls[0][0]
            const saved = JSON.parse(savedRaw)
            expect(saved["@context"]).toEqual(newContext)
        })
    })

    describe("event forwarding on metadata-changed", () => {
        it("should emit graph-changed and context-changed when crate metadata changes", async () => {
            const graphListener = jest.fn()
            const contextListener = jest.fn()
            adapter.events.addEventListener("graph-changed", graphListener)
            adapter.events.addEventListener("context-changed", contextListener)

            const newGraph = [{ "@id": "./", "@type": "Dataset", name: "New" }]
            const newContext = "https://w3id.org/ro/crate/1.2/context"
            const newCrate: ICrate = {
                "@context": newContext,
                "@graph": newGraph as IEntity[]
            }
            mockCrateService._events.emit("metadata-changed", JSON.stringify(newCrate))

            // Allow async onMetadataChanged to complete
            await new Promise((r) => setTimeout(r, 10))

            expect(graphListener).toHaveBeenCalledWith(newGraph)
            expect(contextListener).toHaveBeenCalledWith(newContext)
        })

        it("should parse the metadata string and forward typed objects", async () => {
            const graphListener = jest.fn()
            adapter.events.addEventListener("graph-changed", graphListener)

            const crate: ICrate = {
                "@context": "https://w3id.org/ro/crate/1.1/context",
                "@graph": [
                    { "@id": "./", "@type": "Dataset", name: "Root" },
                    { "@id": "file.txt", "@type": "File", name: "A file" }
                ]
            }
            mockCrateService._events.emit("metadata-changed", JSON.stringify(crate))
            await new Promise((r) => setTimeout(r, 10))

            const emittedGraph = graphListener.mock.calls[0][0] as IEntity[]
            expect(emittedGraph).toHaveLength(2)
            expect(emittedGraph[0]["@id"]).toBe("./")
            expect(emittedGraph[1]["@id"]).toBe("file.txt")
        })
    })

    describe("parse (via invalid inputs)", () => {
        it("should throw on invalid JSON", async () => {
            ;(mockCrateService.getMetadata as jest.Mock).mockResolvedValue("not json")
            await expect(adapter.getMetadataGraph()).rejects.toThrow()
        })

        it("should throw on non-object JSON", async () => {
            ;(mockCrateService.getMetadata as jest.Mock).mockResolvedValue('"just a string"')
            await expect(adapter.getMetadataGraph()).rejects.toThrow(
                "Invalid crate metadata: expected a JSON object"
            )
        })

        it("should throw when @graph is missing", async () => {
            ;(mockCrateService.getMetadata as jest.Mock).mockResolvedValue(
                JSON.stringify({ "@context": "test" })
            )
            await expect(adapter.getMetadataGraph()).rejects.toThrow(
                'Invalid crate metadata: missing or malformed "@graph"'
            )
        })

        it("should throw when @graph is not an array", async () => {
            ;(mockCrateService.getMetadata as jest.Mock).mockResolvedValue(
                JSON.stringify({ "@context": "test", "@graph": "not-an-array" })
            )
            await expect(adapter.getMetadataGraph()).rejects.toThrow(
                'Invalid crate metadata: missing or malformed "@graph"'
            )
        })

        it("should throw when @context is missing", async () => {
            ;(mockCrateService.getMetadata as jest.Mock).mockResolvedValue(
                JSON.stringify({ "@graph": [] })
            )
            await expect(adapter.getMetadataGraph()).rejects.toThrow(
                'Invalid crate metadata: missing "@context"'
            )
        })
    })

    describe("dispose", () => {
        it("should remove the metadata-changed listener from the crate service", async () => {
            const listener = jest.fn()
            adapter.events.addEventListener("graph-changed", listener)

            adapter.dispose()

            const newCrate: ICrate = {
                "@context": "https://w3id.org/ro/crate/1.1/context",
                "@graph": [{ "@id": "./", "@type": "Dataset", name: "New" }]
            }
            mockCrateService._events.emit("metadata-changed", JSON.stringify(newCrate))

            await new Promise((r) => setTimeout(r, 10))
            expect(listener).not.toHaveBeenCalled()
        })

        it("should be safe to call dispose multiple times", () => {
            expect(() => {
                adapter.dispose()
                adapter.dispose()
            }).not.toThrow()
        })
    })
})
