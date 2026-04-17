import { CrateFactory } from "@/lib/core/impl/CrateFactory"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { Observable } from "@/lib/core/impl/Observable"
import JSZip from "jszip"

/** A minimal valid @graph with root entity + metadata descriptor. */
function validGraph(name = "Test", description = ""): IEntity[] {
    return [
        { "@id": "./", "@type": "Dataset", name, description },
        {
            "@id": "ro-crate-metadata.json",
            "@type": "CreativeWork",
            about: { "@id": "./" },
            conformsTo: { "@id": "https://w3id.org/ro/crate/1.2" }
        }
    ]
}

/** A minimal valid ICrate with root entity + metadata descriptor. */
function validCrate(name = "Test", description = ""): ICrate {
    return {
        "@context": "https://w3id.org/ro/crate/1.2/context",
        "@graph": validGraph(name, description)
    }
}

function createMockFileService(): IFileService {
    return {
        events: new Observable(),
        getContentList: jest.fn(),
        getInfo: jest.fn(),
        getFile: jest.fn(),
        addFile: jest.fn().mockResolvedValue(undefined),
        addFolder: jest.fn(),
        updateFile: jest.fn(),
        move: jest.fn(),
        delete: jest.fn(),
        getStorageQuota: jest.fn()
    }
}

function createMockCrateService(fileService?: IFileService): ICrateService {
    const fs = fileService ?? createMockFileService()
    let metadata = ""
    return {
        events: new Observable(),
        getMetadata: jest.fn(async () => metadata),
        setMetadata: jest.fn(async (m: string) => {
            metadata = m
        }),
        getFileService: jest.fn(() => fs)
    }
}

function createMockRepositoryService(): IRepositoryService {
    return {
        events: new Observable(),
        getCratesList: jest.fn(),
        createCrateFromZip: jest.fn(async () => "zip-crate-id"),
        createCrateFromMetadata: jest.fn(async () => "meta-crate-id"),
        deleteCrate: jest.fn(),
        getCrateAs: jest.fn(),
        getStorageQuota: jest.fn()
    }
}

function createMockPersistence(
    repo?: IRepositoryService,
    crateServiceForFactory?: ICrateService
): IPersistenceService {
    const r = repo ?? createMockRepositoryService()
    return {
        events: new Observable(),
        getCrateId: jest.fn(() => null),
        canSetCrateId: jest.fn(() => true),
        setCrateId: jest.fn(),
        getCrateService: jest.fn(() => null),
        getRepositoryService: jest.fn(() => r),
        createCrateServiceFor: jest.fn(async () => crateServiceForFactory ?? null),
        healthCheck: jest.fn(async () => {})
    }
}

describe("CrateFactory", () => {
    describe("createEmptyCrate", () => {
        it("should create a crate with a valid RO-Crate v1.2 template", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            await factory.createEmptyCrate("My Crate", "A test crate")

            expect(repo.createCrateFromMetadata).toHaveBeenCalledTimes(1)
            const json = (repo.createCrateFromMetadata as jest.Mock).mock.calls[0][0]
            const crate = JSON.parse(json) as ICrate

            expect(crate["@context"]).toBe("https://w3id.org/ro/crate/1.2/context")
            expect(crate["@graph"]).toHaveLength(2)

            const root = crate["@graph"].find((e) => e["@id"] === "./")
            expect(root).toBeDefined()
            expect(root!["@type"]).toBe("Dataset")
            expect(root!.name).toBe("My Crate")
            expect(root!.description).toBe("A test crate")

            const descriptor = crate["@graph"].find((e) => e["@id"] === "ro-crate-metadata.json")
            expect(descriptor).toBeDefined()
            expect(descriptor!["@type"]).toBe("CreativeWork")
            expect((descriptor!.about as IReference)["@id"]).toBe("./")
            expect((descriptor!.conformsTo as IReference)["@id"]).toBe(
                "https://w3id.org/ro/crate/1.2"
            )
        })

        it("should return the crate ID from the repository", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const id = await factory.createEmptyCrate("Test", "")

            expect(id).toBe("meta-crate-id")
        })

        it("should throw when repository service is not available", async () => {
            const persistence = createMockPersistence()
            ;(persistence.getRepositoryService as jest.Mock).mockReturnValue(null)
            const factory = new CrateFactory(persistence)

            await expect(factory.createEmptyCrate("Test", "")).rejects.toThrow(
                "Repository service is not available"
            )
        })
    })

    describe("createCrateFromFile", () => {
        it("should delegate JSON files to createCrateFromMetadataFile", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const validJson = JSON.stringify({
                "@context": "https://w3id.org/ro/crate/1.1/context",
                "@graph": [{ "@id": "./", "@type": "Dataset" }]
            })
            const blob = new Blob([validJson], { type: "application/json" })

            const id = await factory.createCrateFromFile(blob)

            expect(repo.createCrateFromMetadata).toHaveBeenCalledWith(validJson)
            expect(id).toBe("meta-crate-id")
        })

        it("should delegate JSON-LD files to createCrateFromMetadataFile", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const validJson = JSON.stringify({
                "@context": "https://w3id.org/ro/crate/1.1/context",
                "@graph": []
            })
            const blob = new Blob([validJson], { type: "application/ld+json" })

            await factory.createCrateFromFile(blob)

            expect(repo.createCrateFromMetadata).toHaveBeenCalled()
            expect(repo.createCrateFromZip).not.toHaveBeenCalled()
        })

        it("should delegate zip files to repository createCrateFromZip", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const blob = new Blob(["fake zip"], { type: "application/zip" })

            const id = await factory.createCrateFromFile(blob)

            expect(repo.createCrateFromZip).toHaveBeenCalledWith(blob)
            expect(repo.createCrateFromMetadata).not.toHaveBeenCalled()
            expect(id).toBe("zip-crate-id")
        })

        it("should default to zip for unknown MIME types", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const blob = new Blob(["data"], { type: "application/octet-stream" })

            await factory.createCrateFromFile(blob)

            expect(repo.createCrateFromZip).toHaveBeenCalledWith(blob)
        })
    })

    describe("createCrateFromMetadataFile", () => {
        it("should validate and pass valid JSON metadata to the repository", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const validJson = JSON.stringify({
                "@context": "https://w3id.org/ro/crate/1.1/context",
                "@graph": [{ "@id": "./", "@type": "Dataset" }]
            })
            const blob = new Blob([validJson])

            const id = await factory.createCrateFromMetadataFile(blob)

            expect(repo.createCrateFromMetadata).toHaveBeenCalledWith(validJson)
            expect(id).toBe("meta-crate-id")
        })

        it("should throw on invalid JSON", async () => {
            const persistence = createMockPersistence()
            const factory = new CrateFactory(persistence)

            const blob = new Blob(["not json at all"])

            await expect(factory.createCrateFromMetadataFile(blob)).rejects.toThrow(
                "Invalid JSON in metadata file"
            )
        })

        it("should throw when @graph is missing", async () => {
            const persistence = createMockPersistence()
            const factory = new CrateFactory(persistence)

            const blob = new Blob([JSON.stringify({ "@context": "test" })])

            await expect(factory.createCrateFromMetadataFile(blob)).rejects.toThrow(
                "Invalid RO-Crate metadata"
            )
        })

        it("should throw when @context is missing", async () => {
            const persistence = createMockPersistence()
            const factory = new CrateFactory(persistence)

            const blob = new Blob([JSON.stringify({ "@graph": [] })])

            await expect(factory.createCrateFromMetadataFile(blob)).rejects.toThrow(
                "Invalid RO-Crate metadata"
            )
        })

        it("should throw when @graph is not an array", async () => {
            const persistence = createMockPersistence()
            const factory = new CrateFactory(persistence)

            const blob = new Blob([JSON.stringify({ "@context": "test", "@graph": "not-array" })])

            await expect(factory.createCrateFromMetadataFile(blob)).rejects.toThrow(
                "Invalid RO-Crate metadata"
            )
        })

        it("should accept object-style @context", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const json = JSON.stringify({
                "@context": { "@vocab": "https://w3id.org/ro/crate/1.1/context" },
                "@graph": []
            })
            const blob = new Blob([json])

            await factory.createCrateFromMetadataFile(blob)

            expect(repo.createCrateFromMetadata).toHaveBeenCalledWith(json)
        })

        it("should accept array-style @context", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const json = JSON.stringify({
                "@context": [
                    "https://w3id.org/ro/crate/1.1/context",
                    { custom: "https://example.org/" }
                ],
                "@graph": []
            })
            const blob = new Blob([json])

            await factory.createCrateFromMetadataFile(blob)

            expect(repo.createCrateFromMetadata).toHaveBeenCalledWith(json)
        })
    })

    describe("createCrateFromFiles", () => {
        it("should create an empty crate and upload files into it", async () => {
            const fileService = createMockFileService()
            const crateService = createMockCrateService(fileService)
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo, crateService)

            ;(crateService.getMetadata as jest.Mock).mockResolvedValue(
                JSON.stringify(validCrate("Test", ""))
            )

            const factory = new CrateFactory(persistence)

            const files = [
                {
                    relativePath: "myFolder/file1.txt",
                    data: new File([new Blob(["content1"])], "file1.txt")
                },
                {
                    relativePath: "myFolder/file2.txt",
                    data: new File([new Blob(["content2"])], "file2.txt")
                }
            ]

            const id = await factory.createCrateFromFiles("Test", "", files)

            expect(id).toBe("meta-crate-id")
            expect(persistence.createCrateServiceFor).toHaveBeenCalledWith("meta-crate-id")
            expect(fileService.addFile).toHaveBeenCalledTimes(2)

            // Verify metadata was written with entities for the uploaded files
            // Set metadata is called twice (once for each entity) and includes all metadata in the second call
            const writtenMetadata = (crateService.setMetadata as jest.Mock).mock.calls[1][0]
            const crate = JSON.parse(writtenMetadata) as ICrate
            const fileEntities = crate["@graph"].filter((e) => e["@type"] === "File")
            expect(fileEntities).toHaveLength(2)

            // Verify hasPart was updated
            const root = crate["@graph"].find((e) => e["@id"] === "./")
            expect(root!.hasPart).toBeDefined()
            expect((root!.hasPart as IReference[]).length).toBeGreaterThanOrEqual(2)
        })

        it("should report progress via the callback", async () => {
            const crateService = createMockCrateService()
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo, crateService)

            ;(crateService.getMetadata as jest.Mock).mockResolvedValue(JSON.stringify(validCrate()))

            const factory = new CrateFactory(persistence)
            const progressCallback = jest.fn()

            await factory.createCrateFromFiles(
                "Test",
                "",
                [
                    { relativePath: "a/f1.txt", data: new File([new Blob(["1"])], "f1.txt") },
                    { relativePath: "a/f2.txt", data: new File([new Blob(["2"])], "f2.txt") },
                    { relativePath: "a/f3.txt", data: new File([new Blob(["3"])], "f3.txt") }
                ],
                progressCallback
            )

            expect(progressCallback).toHaveBeenCalledTimes(3)
            expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 3, [])
            expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 3, [])
            expect(progressCallback).toHaveBeenNthCalledWith(3, 3, 3, [])
        })

        it("should collect errors without aborting", async () => {
            const fileService = createMockFileService()
            ;(fileService.addFile as jest.Mock)
                .mockResolvedValueOnce(undefined) // first file succeeds
                .mockRejectedValueOnce(new Error("upload failed")) // second fails
                .mockResolvedValueOnce(undefined) // third succeeds

            const crateService = createMockCrateService(fileService)
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo, crateService)

            ;(crateService.getMetadata as jest.Mock).mockResolvedValue(JSON.stringify(validCrate()))

            const factory = new CrateFactory(persistence)
            const progressCallback = jest.fn()

            const id = await factory.createCrateFromFiles(
                "Test",
                "",
                [
                    { relativePath: "a/a.txt", data: new File([new Blob(["1"])], "a.txt") },
                    { relativePath: "a/b.txt", data: new File([new Blob(["2"])], "b.txt") },
                    { relativePath: "a/c.txt", data: new File([new Blob(["3"])], "c.txt") }
                ],
                progressCallback
            )

            // Should still return the crate ID
            expect(id).toBe("meta-crate-id")

            // Progress callback should report the error
            const lastCall = progressCallback.mock.calls[2]
            expect(lastCall[2]).toHaveLength(1)
            expect(lastCall[2][0]).toContain("upload failed")
        })

        it("should throw when crate service is not available after creation", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            // createCrateServiceFor returns null — simulating a failure to open
            ;(persistence.createCrateServiceFor as jest.Mock).mockResolvedValue(null)

            const factory = new CrateFactory(persistence)

            await expect(
                factory.createCrateFromFiles("Test", "", [
                    { relativePath: "a/f.txt", data: new File([new Blob(["1"])], "f.txt") }
                ])
            ).rejects.toThrow("Crate services not available")
        })

        it("should strip the leading folder from webkitRelativePath", async () => {
            const fileService = createMockFileService()
            const crateService = createMockCrateService(fileService)
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo, crateService)

            ;(crateService.getMetadata as jest.Mock).mockResolvedValue(JSON.stringify(validCrate()))

            const factory = new CrateFactory(persistence)

            await factory.createCrateFromFiles("Test", "", [
                {
                    relativePath: "myFolder/sub/file.txt",
                    data: new File([new Blob(["x"])], "file.txt")
                }
            ])

            // The file path should have the leading folder replaced
            expect(fileService.addFile).toHaveBeenCalledWith("sub/file.txt", expect.any(Blob))
        })
    })

    describe("duplicateCrate", () => {
        it("should export, modify metadata, and reimport the crate", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const originalCrate = validCrate("Original", "A crate")
            originalCrate["@graph"].push({ "@id": "file.txt", "@type": "File", name: "A file" })

            const zip = new JSZip()
            zip.file("ro-crate-metadata.json", JSON.stringify(originalCrate))
            zip.file("file.txt", "content")
            const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

            ;(repo.getCrateAs as jest.Mock).mockResolvedValue(new Blob([zipBuffer]))

            const id = await factory.duplicateCrate("source-crate-id")

            expect(repo.getCrateAs).toHaveBeenCalledWith("source-crate-id", "zip")
            expect(repo.createCrateFromZip).toHaveBeenCalledTimes(1)
            expect(id).toBe("zip-crate-id")

            // Verify the reimported zip has the modified name
            const reimportedZipBlob = (repo.createCrateFromZip as jest.Mock).mock
                .calls[0][0] as Blob
            const reimportedZip = await JSZip.loadAsync(await reimportedZipBlob.arrayBuffer())
            const reimportedMeta = await reimportedZip
                .file("ro-crate-metadata.json")!
                .async("string")
            const reimportedCrate = JSON.parse(reimportedMeta) as ICrate

            const root = reimportedCrate["@graph"].find((e) => e["@id"] === "./")
            expect(root!.name).toBe("Copy of Original")

            // Other files should be preserved
            expect(reimportedZip.file("file.txt")).not.toBeNull()
        })

        it("should use the provided newName instead of default", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const crate = validCrate("Original")
            const zip = new JSZip()
            zip.file("ro-crate-metadata.json", JSON.stringify(crate))
            ;(repo.getCrateAs as jest.Mock).mockResolvedValue(
                new Blob([await zip.generateAsync({ type: "arraybuffer" })])
            )

            await factory.duplicateCrate("source", "My Custom Name")

            const reimportedBlob = (repo.createCrateFromZip as jest.Mock).mock.calls[0][0] as Blob
            const reimportedZip = await JSZip.loadAsync(await reimportedBlob.arrayBuffer())
            const meta = JSON.parse(
                await reimportedZip.file("ro-crate-metadata.json")!.async("string")
            ) as ICrate
            expect(meta["@graph"].find((e) => e["@id"] === "./")!.name).toBe("My Custom Name")
        })

        it("should handle a zip without ro-crate-metadata.json gracefully", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            const zip = new JSZip()
            zip.file("some-file.txt", "content")
            ;(repo.getCrateAs as jest.Mock).mockResolvedValue(
                new Blob([await zip.generateAsync({ type: "arraybuffer" })])
            )

            // Should not throw — just reimport as-is
            await expect(factory.duplicateCrate("source")).resolves.toBe("zip-crate-id")
        })

        it("should handle a crate with no root entity gracefully", async () => {
            const repo = createMockRepositoryService()
            const persistence = createMockPersistence(repo)
            const factory = new CrateFactory(persistence)

            // Has metadata descriptor but about points to a non-existent entity
            const crate: ICrate = {
                "@context": "https://w3id.org/ro/crate/1.2/context",
                "@graph": [
                    { "@id": "something", "@type": "Thing" },
                    {
                        "@id": "ro-crate-metadata.json",
                        "@type": "CreativeWork",
                        about: { "@id": "./nonexistent" }
                    }
                ]
            }
            const zip = new JSZip()
            zip.file("ro-crate-metadata.json", JSON.stringify(crate))
            ;(repo.getCrateAs as jest.Mock).mockResolvedValue(
                new Blob([await zip.generateAsync({ type: "arraybuffer" })])
            )

            // Should not throw — metadata is still written, just no name change
            await expect(factory.duplicateCrate("source")).resolves.toBe("zip-crate-id")
        })
    })
})
