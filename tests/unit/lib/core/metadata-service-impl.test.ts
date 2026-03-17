import { MetadataServiceImpl } from "@/lib/core/impl/MetadataServiceImpl"
import { Observable } from "@/lib/core/impl/Observable"
import { IPersistenceAdapter, IPersistenceAdapterEvents } from "@/lib/core/IPersistenceAdapter"

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
        name: "Test Person",
        worksFor: { "@id": "#example-org" }
    },
    {
        "@id": "#example-org",
        "@type": "Organization",
        name: "Example Org"
    },
    {
        "@id": "result.json",
        "@type": "File",
        name: "JSON Result File",
        contentSize: "1567"
    }
]

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

describe("MetadataServiceImpl", () => {
    let mockAdapter: ReturnType<typeof createMockPersistenceAdapter>
    let service: MetadataServiceImpl

    beforeEach(async () => {
        mockAdapter = createMockPersistenceAdapter()
        service = await MetadataServiceImpl.newInstance(mockAdapter)
    })

    describe("newInstance", () => {
        it("should load entities from the persistence adapter", () => {
            expect(mockAdapter.getMetadataGraph).toHaveBeenCalled()
            const entities = service.getEntities()
            expect(entities.length).toBe(testCrateGraph.length)
        })

        it("should have all entities from the test graph accessible", () => {
            const entities = service.getEntities()
            const ids = entities.map((e) => e["@id"])
            expect(ids).toContain("./")
            expect(ids).toContain("ro-crate-metadata.json")
            expect(ids).toContain("#test-person")
            expect(ids).toContain("#example-org")
            expect(ids).toContain("result.json")
        })
    })

    describe("getEntities", () => {
        it("should return all entities as an array", () => {
            const entities = service.getEntities()
            expect(Array.isArray(entities)).toBe(true)
            expect(entities.length).toBe(5)
        })

        it("should return entities with their properties intact", () => {
            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            expect(root).toBeDefined()
            expect(root!.name).toBe("TestCrate")
            expect(root!.description).toBe("The Test Crate")
        })
    })

    describe("addEntity", () => {
        it("should add a new contextual entity", async () => {
            const newEntity: IEntity = {
                "@id": "#new-person",
                "@type": "Person",
                name: "New Person"
            }
            const result = await service.addEntity(newEntity)
            expect(result).toBe(true)

            const entities = service.getEntities()
            expect(entities.find((e) => e["@id"] === "#new-person")).toBeDefined()
            expect(mockAdapter.updateMetadataGraph).toHaveBeenCalled()
        })

        it("should return false when adding a duplicate entity without overwrite", async () => {
            const duplicate: IEntity = {
                "@id": "#test-person",
                "@type": "Person",
                name: "Duplicate"
            }
            const result = await service.addEntity(duplicate, false)
            expect(result).toBe(false)
        })

        it("should overwrite an existing entity when overwrite is true", async () => {
            const updated: IEntity = {
                "@id": "#test-person",
                "@type": "Person",
                name: "Updated Person"
            }
            const result = await service.addEntity(updated, true)
            expect(result).toBe(true)

            const entities = service.getEntities()
            const person = entities.find((e) => e["@id"] === "#test-person")
            expect(person!.name).toBe("Updated Person")
        })

        it("should add a File data entity to the root hasPart", async () => {
            const fileEntity: IEntity = {
                "@id": "new-file.txt",
                "@type": "File",
                name: "New File"
            }
            await service.addEntity(fileEntity)

            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            expect(root).toBeDefined()
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "new-file.txt")).toBeDefined()
        })

        it("should add a Dataset (folder) data entity to the root hasPart", async () => {
            const folderEntity: IEntity = {
                "@id": "new-folder/",
                "@type": "Dataset",
                name: "New Folder"
            }
            await service.addEntity(folderEntity)

            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "new-folder/")).toBeDefined()
        })

        it("should not add a contextual entity to hasPart", async () => {
            const contextualEntity: IEntity = {
                "@id": "#new-place",
                "@type": "Place",
                name: "New Place"
            }

            const rootBefore = service.getEntities().find((e) => e["@id"] === "./")
            const hasPartLengthBefore = (rootBefore!.hasPart as IReference[]).length

            await service.addEntity(contextualEntity)

            const rootAfter = service.getEntities().find((e) => e["@id"] === "./")
            const hasPartLengthAfter = (rootAfter!.hasPart as IReference[]).length

            expect(hasPartLengthAfter).toBe(hasPartLengthBefore)
        })

        it("should emit graph-changed event after adding", async () => {
            const listener = jest.fn()
            service.events.addEventListener("graph-changed", listener)

            await service.addEntity({
                "@id": "#new-entity",
                "@type": "Thing",
                name: "New"
            })

            expect(listener).toHaveBeenCalled()
        })

        it("should persist changes through the adapter", async () => {
            await service.addEntity({
                "@id": "#new-entity",
                "@type": "Thing",
                name: "New"
            })

            expect(mockAdapter.updateMetadataGraph).toHaveBeenCalled()
        })

        it("should create hasPart array on root if it does not exist", async () => {
            const graphWithoutHasPart: IEntity[] = [
                {
                    "@id": "./",
                    "@type": "Dataset",
                    name: "No HasPart Crate"
                },
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    about: { "@id": "./" },
                    conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" }
                }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(graphWithoutHasPart)
            const newService = await MetadataServiceImpl.newInstance(mockAdapter)

            const fileEntity: IEntity = {
                "@id": "test-file.txt",
                "@type": "File",
                name: "Test File"
            }
            await newService.addEntity(fileEntity)

            const root = newService.getEntities().find((e) => e["@id"] === "./")
            expect(root!.hasPart).toBeDefined()
            expect(Array.isArray(root!.hasPart)).toBe(true)
            expect(
                (root!.hasPart as IReference[]).find((p) => p["@id"] === "test-file.txt")
            ).toBeDefined()
        })
    })

    describe("addEntity with array @type", () => {
        it("should add a File entity with array @type to root hasPart", async () => {
            const fileEntity: IEntity = {
                "@id": "source.py",
                "@type": ["File", "SoftwareSourceCode"],
                name: "Source Code"
            }
            await service.addEntity(fileEntity)

            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "source.py")).toBeDefined()
        })

        it("should add a Dataset entity with array @type to root hasPart", async () => {
            const folderEntity: IEntity = {
                "@id": "results/",
                "@type": ["Dataset", "Collection"],
                name: "Results"
            }
            await service.addEntity(folderEntity)

            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "results/")).toBeDefined()
        })

        it("should add a MediaObject entity with array @type to root hasPart", async () => {
            const mediaEntity: IEntity = {
                "@id": "video.mp4",
                "@type": ["MediaObject", "VideoObject"],
                name: "Video File"
            }
            await service.addEntity(mediaEntity)

            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "video.mp4")).toBeDefined()
        })

        it("should not add an entity with array @type that has no data types to hasPart", async () => {
            const contextualEntity: IEntity = {
                "@id": "#researcher",
                "@type": ["Person", "ScholarlyArticle"],
                name: "A Researcher"
            }

            const rootBefore = service.getEntities().find((e) => e["@id"] === "./")
            const hasPartLengthBefore = (rootBefore!.hasPart as IReference[]).length

            await service.addEntity(contextualEntity)

            const rootAfter = service.getEntities().find((e) => e["@id"] === "./")
            const hasPartLengthAfter = (rootAfter!.hasPart as IReference[]).length
            expect(hasPartLengthAfter).toBe(hasPartLengthBefore)
        })
    })

    describe("updateEntity", () => {
        it("should update an existing entity's properties", async () => {
            await service.updateEntity({
                "@id": "#test-person",
                "@type": "Person",
                name: "Updated Name",
                worksFor: { "@id": "#example-org" }
            })

            const entities = service.getEntities()
            const person = entities.find((e) => e["@id"] === "#test-person")
            expect(person!.name).toBe("Updated Name")
        })

        it("should remove properties not present in the update", async () => {
            await service.updateEntity({
                "@id": "#test-person",
                "@type": "Person",
                name: "Test Person"
                // worksFor is omitted, so it should be removed
            })

            const entities = service.getEntities()
            const person = entities.find((e) => e["@id"] === "#test-person")
            expect(person!.worksFor).toBeUndefined()
        })

        it("should delete properties with null values", async () => {
            await service.updateEntity({
                "@id": "#test-person",
                "@type": "Person",
                name: null as any,
                worksFor: { "@id": "#example-org" }
            })

            const entities = service.getEntities()
            const person = entities.find((e) => e["@id"] === "#test-person")
            expect(person!.name).toBeUndefined()
        })

        it("should add the entity if it does not exist", async () => {
            await service.updateEntity({
                "@id": "#brand-new",
                "@type": "Thing",
                name: "Brand New"
            })

            const entities = service.getEntities()
            const entity = entities.find((e) => e["@id"] === "#brand-new")
            expect(entity).toBeDefined()
            expect(entity!.name).toBe("Brand New")
        })

        it("should emit graph-changed and persist after update", async () => {
            const listener = jest.fn()
            service.events.addEventListener("graph-changed", listener)

            await service.updateEntity({
                "@id": "#test-person",
                "@type": "Person",
                name: "Updated"
            })

            expect(listener).toHaveBeenCalled()
            expect(mockAdapter.updateMetadataGraph).toHaveBeenCalled()
        })

        it("should add new properties to an existing entity", async () => {
            await service.updateEntity({
                "@id": "#test-person",
                "@type": "Person",
                name: "Test Person",
                worksFor: { "@id": "#example-org" },
                email: "test@example.com"
            })

            const entities = service.getEntities()
            const person = entities.find((e) => e["@id"] === "#test-person")
            expect(person!.email).toBe("test@example.com")
        })
    })

    describe("deleteEntity", () => {
        it("should delete an existing entity", async () => {
            await service.deleteEntity("#test-person")

            const entities = service.getEntities()
            expect(entities.find((e) => e["@id"] === "#test-person")).toBeUndefined()
        })

        it("should remove deleted file entity from root hasPart", async () => {
            await service.deleteEntity("result.json")

            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "result.json")).toBeUndefined()
        })

        it("should not throw when deleting a non-existent entity", async () => {
            await expect(service.deleteEntity("#non-existent")).resolves.not.toThrow()
        })

        it("should emit graph-changed and persist after deletion", async () => {
            const listener = jest.fn()
            service.events.addEventListener("graph-changed", listener)

            await service.deleteEntity("#test-person")

            expect(listener).toHaveBeenCalled()
            expect(mockAdapter.updateMetadataGraph).toHaveBeenCalled()
        })
    })

    describe("changeEntityIdentifier", () => {
        it("should change an entity's identifier", async () => {
            await service.changeEntityIdentifier("#test-person", "#renamed-person")

            const entities = service.getEntities()
            expect(entities.find((e) => e["@id"] === "#test-person")).toBeUndefined()
            expect(entities.find((e) => e["@id"] === "#renamed-person")).toBeDefined()
        })

        it("should update references to the renamed entity across the graph", async () => {
            await service.changeEntityIdentifier("#example-org", "#renamed-org")

            const entities = service.getEntities()
            const person = entities.find((e) => e["@id"] === "#test-person")
            expect(person).toBeDefined()
            expect((person!.worksFor as IReference)["@id"]).toBe("#renamed-org")
        })

        it("should throw when target identifier already exists", async () => {
            await expect(
                service.changeEntityIdentifier("#test-person", "#example-org")
            ).rejects.toBeDefined()
        })

        it("should update child entities when renaming a folder (path ending with /)", async () => {
            const folderGraph: IEntity[] = [
                {
                    "@id": "./",
                    "@type": "Dataset",
                    name: "Root",
                    hasPart: [
                        { "@id": "data/" },
                        { "@id": "data/file1.txt" },
                        { "@id": "data/sub/" }
                    ]
                },
                {
                    "@id": "data/",
                    "@type": "Dataset",
                    name: "Data Folder"
                },
                {
                    "@id": "data/file1.txt",
                    "@type": "File",
                    name: "File 1"
                },
                {
                    "@id": "data/sub/",
                    "@type": "Dataset",
                    name: "Sub Folder"
                }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(folderGraph)
            const newService = await MetadataServiceImpl.newInstance(mockAdapter)

            await newService.changeEntityIdentifier("data/", "renamed-data/")

            const entities = newService.getEntities()
            const ids = entities.map((e) => e["@id"])

            expect(ids).toContain("renamed-data/")
            expect(ids).not.toContain("data/")
            expect(ids).toContain("renamed-data/file1.txt")
            expect(ids).not.toContain("data/file1.txt")
            expect(ids).toContain("renamed-data/sub/")
            expect(ids).not.toContain("data/sub/")
        })

        it("should also update hasPart references when renaming a folder", async () => {
            const folderGraph: IEntity[] = [
                {
                    "@id": "./",
                    "@type": "Dataset",
                    name: "Root",
                    hasPart: [{ "@id": "data/" }, { "@id": "data/file1.txt" }]
                },
                {
                    "@id": "data/",
                    "@type": "Dataset",
                    name: "Data"
                },
                {
                    "@id": "data/file1.txt",
                    "@type": "File",
                    name: "File 1"
                }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(folderGraph)
            const newService = await MetadataServiceImpl.newInstance(mockAdapter)

            await newService.changeEntityIdentifier("data/", "output/")

            const entities = newService.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            const hasPart = root!.hasPart as IReference[]
            const hasPartIds = hasPart.map((p) => p["@id"])
            expect(hasPartIds).toContain("output/")
            expect(hasPartIds).toContain("output/file1.txt")
            expect(hasPartIds).not.toContain("data/")
            expect(hasPartIds).not.toContain("data/file1.txt")
        })

        it("should emit graph-changed and persist after rename", async () => {
            const listener = jest.fn()
            service.events.addEventListener("graph-changed", listener)

            await service.changeEntityIdentifier("#test-person", "#renamed-person")

            expect(listener).toHaveBeenCalled()
            expect(mockAdapter.updateMetadataGraph).toHaveBeenCalled()
        })
    })

    describe("deleteEntity edge cases", () => {
        it("should handle deleting the root entity", async () => {
            await service.deleteEntity("./")

            const entities = service.getEntities()
            expect(entities.find((e) => e["@id"] === "./")).toBeUndefined()
        })

        it("should handle deleting the metadata entity (ro-crate-metadata.json)", async () => {
            await service.deleteEntity("ro-crate-metadata.json")

            const entities = service.getEntities()
            expect(entities.find((e) => e["@id"] === "ro-crate-metadata.json")).toBeUndefined()
        })

        it("should still work for file deletion after root entity is deleted", async () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

            await service.deleteEntity("./")
            // Deleting a file entity when the root is gone should not throw
            await expect(service.deleteEntity("result.json")).resolves.not.toThrow()

            warnSpy.mockRestore()
        })
    })

    describe("changeEntityIdentifier edge cases", () => {
        it("should handle renaming the metadata entity", async () => {
            await service.changeEntityIdentifier(
                "ro-crate-metadata.json",
                "ro-crate-metadata.jsonld"
            )

            const entities = service.getEntities()
            expect(entities.find((e) => e["@id"] === "ro-crate-metadata.json")).toBeUndefined()
            expect(entities.find((e) => e["@id"] === "ro-crate-metadata.jsonld")).toBeDefined()
        })

        it("should update about reference when metadata entity is renamed", async () => {
            await service.changeEntityIdentifier(
                "ro-crate-metadata.json",
                "ro-crate-metadata.jsonld"
            )

            const entities = service.getEntities()
            const meta = entities.find((e) => e["@id"] === "ro-crate-metadata.jsonld")
            expect(meta).toBeDefined()
            // The about reference should still point to root
            expect((meta!.about as IReference)["@id"]).toBe("./")
        })

        it("should not rename child entities for non-folder identifier renames", async () => {
            // Renaming a file should not affect other entities that happen to share a prefix
            const graphWithSimilarPaths: IEntity[] = [
                {
                    "@id": "./",
                    "@type": "Dataset",
                    name: "Root",
                    hasPart: [{ "@id": "data.json" }, { "@id": "data.json.bak" }]
                },
                {
                    "@id": "data.json",
                    "@type": "File",
                    name: "Data"
                },
                {
                    "@id": "data.json.bak",
                    "@type": "File",
                    name: "Data Backup"
                }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(graphWithSimilarPaths)
            const newService = await MetadataServiceImpl.newInstance(mockAdapter)

            await newService.changeEntityIdentifier("data.json", "output.json")

            const entities = newService.getEntities()
            const ids = entities.map((e) => e["@id"])
            expect(ids).toContain("output.json")
            // The .bak file should NOT have been renamed
            expect(ids).toContain("data.json.bak")
            expect(ids).not.toContain("output.json.bak")
        })

        it("should handle folder rename when child path is a substring/superstring of another entity", async () => {
            const graphWithOverlappingPaths: IEntity[] = [
                {
                    "@id": "./",
                    "@type": "Dataset",
                    name: "Root",
                    hasPart: [
                        { "@id": "data/" },
                        { "@id": "data/file.txt" },
                        { "@id": "data-extra/" },
                        { "@id": "data-extra/other.txt" }
                    ]
                },
                { "@id": "data/", "@type": "Dataset", name: "Data" },
                { "@id": "data/file.txt", "@type": "File", name: "File" },
                { "@id": "data-extra/", "@type": "Dataset", name: "Data Extra" },
                { "@id": "data-extra/other.txt", "@type": "File", name: "Other" }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(
                graphWithOverlappingPaths
            )
            const newService = await MetadataServiceImpl.newInstance(mockAdapter)

            await newService.changeEntityIdentifier("data/", "renamed/")

            const entities = newService.getEntities()
            const ids = entities.map((e) => e["@id"])

            // data/ and its children should be renamed
            expect(ids).toContain("renamed/")
            expect(ids).toContain("renamed/file.txt")
            expect(ids).not.toContain("data/")
            expect(ids).not.toContain("data/file.txt")

            // data-extra/ should NOT be affected (it's not a child of data/)
            expect(ids).toContain("data-extra/")
            expect(ids).toContain("data-extra/other.txt")
        })
    })

    describe("non-standard root entity ID (v1.2)", () => {
        let nonStandardService: MetadataServiceImpl

        beforeEach(async () => {
            const graphWithAbsoluteRootId: IEntity[] = [
                {
                    "@id": "https://example.org/my-dataset",
                    "@type": "Dataset",
                    name: "External Dataset",
                    hasPart: [{ "@id": "data.csv" }]
                },
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    about: { "@id": "https://example.org/my-dataset" },
                    conformsTo: { "@id": "https://w3id.org/ro/crate/1.2" }
                },
                {
                    "@id": "data.csv",
                    "@type": "File",
                    name: "Data CSV"
                }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(graphWithAbsoluteRootId)
            nonStandardService = await MetadataServiceImpl.newInstance(mockAdapter)
        })

        it("should load entities with a non-./ root ID", () => {
            const entities = nonStandardService.getEntities()
            expect(
                entities.find((e) => e["@id"] === "https://example.org/my-dataset")
            ).toBeDefined()
        })

        it("should add data entities to hasPart on a non-./ root ID", async () => {
            const fileEntity: IEntity = {
                "@id": "new-file.txt",
                "@type": "File",
                name: "New File"
            }
            await nonStandardService.addEntity(fileEntity)

            // The entity itself should be added
            expect(
                nonStandardService.getEntities().find((e) => e["@id"] === "new-file.txt")
            ).toBeDefined()

            // hasPart on the non-standard root should be updated via getRootEntityID
            const root = nonStandardService
                .getEntities()
                .find((e) => e["@id"] === "https://example.org/my-dataset")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "new-file.txt")).toBeDefined()
        })

        it("should still allow renaming entities in a crate with non-./ root ID", async () => {
            await nonStandardService.changeEntityIdentifier("data.csv", "renamed-data.csv")

            const entities = nonStandardService.getEntities()
            expect(entities.find((e) => e["@id"] === "data.csv")).toBeUndefined()
            expect(entities.find((e) => e["@id"] === "renamed-data.csv")).toBeDefined()
        })

        it("should update references to renamed entities across a non-./ root", async () => {
            await nonStandardService.changeEntityIdentifier("data.csv", "renamed-data.csv")

            const entities = nonStandardService.getEntities()
            const root = entities.find((e) => e["@id"] === "https://example.org/my-dataset")
            const hasPart = root!.hasPart as IReference[]
            expect(hasPart.find((p) => p["@id"] === "renamed-data.csv")).toBeDefined()
            expect(hasPart.find((p) => p["@id"] === "data.csv")).toBeUndefined()
        })
    })

    describe("addEntity when root entity is missing", () => {
        it("should warn but not throw when adding a data entity without root", async () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

            const graphWithoutRoot: IEntity[] = [
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    about: { "@id": "./" }
                }
            ]
            ;(mockAdapter.getMetadataGraph as jest.Mock).mockResolvedValue(graphWithoutRoot)
            const newService = await MetadataServiceImpl.newInstance(mockAdapter)

            const fileEntity: IEntity = {
                "@id": "orphan.txt",
                "@type": "File",
                name: "Orphan File"
            }

            await expect(newService.addEntity(fileEntity)).resolves.not.toThrow()
            // The entity should still be added to the graph
            expect(newService.getEntities().find((e) => e["@id"] === "orphan.txt")).toBeDefined()
            expect(warnSpy).toHaveBeenCalled()

            warnSpy.mockRestore()
        })
    })

    describe("event handling from persistence adapter", () => {
        it("should update its graph when the adapter emits graph-changed", () => {
            const newGraph: IEntity[] = [
                { "@id": "./", "@type": "Dataset", name: "External Update" }
            ]

            mockAdapter._events.emit("graph-changed", newGraph)

            const entities = service.getEntities()
            expect(entities.length).toBe(1)
            expect(entities[0].name).toBe("External Update")
        })

        it("should skip update when the new graph is deeply equal (dequal optimization)", () => {
            const listener = jest.fn()
            service.events.addEventListener("graph-changed", listener)

            // Use JSON roundtrip (not structuredClone) to create an equal copy.
            // In production, data flows through JSON.parse so objects share the
            // same realm constructors. structuredClone in Jest's VM sandbox
            // produces objects from a different realm whose constructors don't
            // match, which causes dequal to always return false.
            const identical = JSON.parse(JSON.stringify(testCrateGraph)) as IEntity[]
            mockAdapter._events.emit("graph-changed", identical)

            expect(listener).not.toHaveBeenCalled()
        })

        it("should update when the graph differs even slightly", () => {
            const listener = jest.fn()
            service.events.addEventListener("graph-changed", listener)

            const modified = JSON.parse(JSON.stringify(testCrateGraph)) as IEntity[]
            modified[0].name = "Changed Name"
            mockAdapter._events.emit("graph-changed", modified)

            expect(listener).toHaveBeenCalled()
            const entities = service.getEntities()
            const root = entities.find((e) => e["@id"] === "./")
            expect(root!.name).toBe("Changed Name")
        })
    })

    describe("dispose", () => {
        it("should stop listening to persistence adapter events after dispose", () => {
            service.dispose()

            const newGraph: IEntity[] = [{ "@id": "./", "@type": "Dataset", name: "After Dispose" }]
            mockAdapter._events.emit("graph-changed", newGraph)

            // Graph should remain unchanged because listener was removed
            const entities = service.getEntities()
            expect(entities.length).toBe(testCrateGraph.length)
            expect(entities.find((e) => e["@id"] === "./")!.name).toBe("TestCrate")
        })
    })
})
