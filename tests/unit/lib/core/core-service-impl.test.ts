import { CoreServiceImpl } from "@/lib/core/impl/CoreServiceImpl"
import { Observable } from "@/lib/core/impl/Observable"
import { IPersistenceAdapter, IPersistenceAdapterEvents } from "@/lib/core/IPersistenceAdapter"
import { ICrateService, ICrateServiceEvents } from "@/lib/core/persistence/ICrateService"
import { IFileService, IFileServiceEvents } from "@/lib/core/persistence/IFileService"

const testCrateGraph: IEntity[] = [
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
        "@id": "#test-person",
        "@type": "Person",
        name: "Test Person"
    },
    {
        "@id": "result.json",
        "@type": "File",
        name: "JSON Result File"
    }
]

function createMockFileService(): IFileService {
    const events = new Observable<IFileServiceEvents>()
    return {
        events,
        getContentList: jest.fn(async () => []),
        getInfo: jest.fn(async () => ({ type: "file" as const, name: "test" })),
        getFile: jest.fn(async () => new Blob()),
        addFile: jest.fn(async () => {}),
        addFolder: jest.fn(async () => {}),
        updateFile: jest.fn(async () => {}),
        move: jest.fn(async () => {}),
        delete: jest.fn(async () => {}),
        getStorageQuota: jest.fn(async () => ({ usedSpace: 0, totalSpace: 0, persistent: false }))
    }
}

function createMockCrateService(
    fileService: IFileService | null = null
): ICrateService & { _events: Observable<ICrateServiceEvents> } {
    const events = new Observable<ICrateServiceEvents>()
    return {
        _events: events,
        events,
        getMetadata: jest.fn(async () => ""),
        setMetadata: jest.fn(async () => {}),
        getFileService: jest.fn(() => fileService)
    }
}

function createMockPersistenceAdapter(): IPersistenceAdapter & {
    _events: Observable<IPersistenceAdapterEvents>
} {
    const events = new Observable<IPersistenceAdapterEvents>()
    return {
        _events: events,
        events,
        getMetadataGraph: jest.fn(
            async () => JSON.parse(JSON.stringify(testCrateGraph)) as IEntity[]
        ),
        getMetadataContext: jest.fn(async () => "https://w3id.org/ro/crate/1.1/context"),
        updateMetadataGraph: jest.fn(async () => {}),
        updateMetadataContext: jest.fn(async () => {})
    }
}

describe("CoreServiceImpl", () => {
    describe("newInstance", () => {
        it("should create an instance with metadata and context services", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            expect(core.getMetadataService()).toBeDefined()
            expect(core.getContextService()).toBeDefined()
        })

        it("should load entities from the persistence adapter", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const entities = core.getMetadataService().getEntities()
            expect(entities.length).toBe(testCrateGraph.length)
        })
    })

    describe("addFileEntity", () => {
        it("should add a file entity to the metadata with type File", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const file = new File(["content"], "test.txt", { type: "text/plain" })
            await core.addFileEntity("Test File", "test.txt", file)

            const entities = core.getMetadataService().getEntities()
            const entity = entities.find((e) => e["@id"] === "test.txt")
            expect(entity).toBeDefined()
            expect(entity!["@type"]).toBe("File")
            expect(entity!.name).toBe("Test File")
        })

        it("should upload the file via file service when available", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const file = new File(["content"], "test.txt", { type: "text/plain" })
            await core.addFileEntity("Test File", "test.txt", file)

            expect(fileService.addFile).toHaveBeenCalledWith("test.txt", file)
        })

        it("should not fail when file service is not available", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(null)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const file = new File(["content"], "test.txt", { type: "text/plain" })
            await expect(core.addFileEntity("Test File", "test.txt", file)).resolves.not.toThrow()
        })

        it("should add the file entity to the root hasPart", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const file = new File(["content"], "new-file.txt", { type: "text/plain" })
            await core.addFileEntity("New File", "new-file.txt", file)

            const entities = core.getMetadataService().getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "new-file.txt")).toBeDefined()
        })
    })

    describe("addFolderEntity", () => {
        it("should add a folder entity with trailing slash appended", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.addFolderEntity("My Folder", "my-folder")

            const entities = core.getMetadataService().getEntities()
            const entity = entities.find((e) => e["@id"] === "my-folder/")
            expect(entity).toBeDefined()
            expect(entity!["@type"]).toBe("Dataset")
            expect(entity!.name).toBe("My Folder")
        })

        it("should not double trailing slash if already present", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.addFolderEntity("My Folder", "my-folder/")

            const entities = core.getMetadataService().getEntities()
            expect(entities.find((e) => e["@id"] === "my-folder/")).toBeDefined()
            expect(entities.find((e) => e["@id"] === "my-folder//")).toBeUndefined()
        })

        it("should create the folder via file service when available", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.addFolderEntity("My Folder", "my-folder")

            expect(fileService.addFolder).toHaveBeenCalledWith("my-folder")
        })

        it("should add the folder entity to the root hasPart", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.addFolderEntity("Data", "data")

            const entities = core.getMetadataService().getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "data/")).toBeDefined()
        })
    })

    describe("addFileEntity with array @type", () => {
        it("should detect a data entity with array @type when renaming", async () => {
            const graphWithArrayType: IEntity[] = [
                {
                    "@id": "./",
                    "@type": "Dataset",
                    name: "Root",
                    hasPart: [{ "@id": "code.py" }]
                },
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    about: { "@id": "./" },
                    conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" }
                },
                {
                    "@id": "code.py",
                    "@type": ["File", "SoftwareSourceCode"],
                    name: "Source Code"
                }
            ]

            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            ;(adapter.getMetadataGraph as jest.Mock).mockResolvedValue(graphWithArrayType)
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.changeEntityIdentifier("code.py", "renamed-code.py")

            // Should call file move because entity with ["File", "SoftwareSourceCode"] IS a data entity
            expect(fileService.move).toHaveBeenCalledWith("code.py", "renamed-code.py")
        })
    })

    describe("changeEntityIdentifier", () => {
        it("should rename a contextual entity in the metadata", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.changeEntityIdentifier("#test-person", "#renamed-person")

            const entities = core.getMetadataService().getEntities()
            expect(entities.find((e) => e["@id"] === "#test-person")).toBeUndefined()
            expect(entities.find((e) => e["@id"] === "#renamed-person")).toBeDefined()
        })

        it("should move the file via file service when renaming a data entity", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.changeEntityIdentifier("result.json", "output.json")

            expect(fileService.move).toHaveBeenCalledWith("result.json", "output.json")
        })

        it("should not call file service move for contextual entities", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.changeEntityIdentifier("#test-person", "#renamed-person")

            expect(fileService.move).not.toHaveBeenCalled()
        })

        it("should not fail when file service is not available for data entity rename", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(null)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await expect(
                core.changeEntityIdentifier("result.json", "output.json")
            ).resolves.not.toThrow()
        })
    })

    describe("deleteEntity", () => {
        it("should delete an entity from the metadata", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.deleteEntity("#test-person", false)

            const entities = core.getMetadataService().getEntities()
            expect(entities.find((e) => e["@id"] === "#test-person")).toBeUndefined()
        })

        it("should delete data from file service when deleteData is true", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.deleteEntity("result.json", true)

            expect(fileService.delete).toHaveBeenCalledWith("result.json")
        })

        it("should not delete data from file service when deleteData is false", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.deleteEntity("result.json", false)

            expect(fileService.delete).not.toHaveBeenCalled()
        })

        it("should not fail when file service is not available and deleteData is true", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(null)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await expect(core.deleteEntity("result.json", true)).resolves.not.toThrow()
        })

        it("should remove file entity from root hasPart", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            await core.deleteEntity("result.json", false)

            const entities = core.getMetadataService().getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "result.json")).toBeUndefined()
        })
    })

    describe("getContextService / getMetadataService", () => {
        it("should return the context service with loaded specification", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const contextService = core.getContextService()
            expect(contextService).toBeDefined()
            expect(contextService.specification).toBeDefined()
        })

        it("should return the metadata service with loaded entities", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            const metadataService = core.getMetadataService()
            expect(metadataService).toBeDefined()
            expect(metadataService.getEntities().length).toBe(testCrateGraph.length)
        })
    })

    describe("file service dynamic change via crate service event", () => {
        it("should switch to a new file service when crate service emits file-service-changed", async () => {
            const fileService1 = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService1)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            // Verify initial file service is used
            const file1 = new File(["content"], "test1.txt")
            await core.addFileEntity("Test 1", "test1.txt", file1)
            expect(fileService1.addFile).toHaveBeenCalledWith("test1.txt", file1)

            // Emit file-service-changed with a new file service
            const fileService2 = createMockFileService()
            crateService._events.emit("file-service-changed", fileService2)

            // Now the new file service should be used
            const file2 = new File(["content2"], "test2.txt")
            await core.addFileEntity("Test 2", "test2.txt", file2)
            expect(fileService2.addFile).toHaveBeenCalledWith("test2.txt", file2)
            // Old file service should not have been called again
            expect(fileService1.addFile).toHaveBeenCalledTimes(1)
        })

        it("should handle file service being set to null", async () => {
            const fileService = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            // Set file service to null via event
            crateService._events.emit("file-service-changed", null)

            // Should not fail — file operations are just skipped
            const file = new File(["content"], "test.txt")
            await expect(core.addFileEntity("Test", "test.txt", file)).resolves.not.toThrow()

            // Original file service should not be called
            expect(fileService.addFile).not.toHaveBeenCalled()
        })
    })

    describe("dispose", () => {
        it("should stop listening to file-service-changed events after dispose", async () => {
            const fileService1 = createMockFileService()
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService(fileService1)
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            core.dispose()

            // Emit file-service-changed after dispose — should be ignored
            const fileService2 = createMockFileService()
            crateService._events.emit("file-service-changed", fileService2)

            // The original file service should still be used (listener was removed)
            const file = new File(["content"], "test.txt")
            await core.addFileEntity("Test", "test.txt", file)
            expect(fileService1.addFile).toHaveBeenCalledWith("test.txt", file)
            expect(fileService2.addFile).not.toHaveBeenCalled()
        })

        it("should be safe to call dispose multiple times", async () => {
            const adapter = createMockPersistenceAdapter()
            const crateService = createMockCrateService()
            const core = await CoreServiceImpl.newInstance(adapter, crateService)

            expect(() => {
                core.dispose()
                core.dispose()
            }).not.toThrow()
        })
    })
})
