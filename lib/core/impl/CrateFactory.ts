import JSZip from "jszip"
import * as z from "zod/mini"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { getRootEntityID } from "@/lib/utils"

const DEFAULT_CONTEXT = "https://w3id.org/ro/crate/1.2/context"
const DEFAULT_CONFORMS_TO = "https://w3id.org/ro/crate/1.2"

function buildCrateTemplate(name: string, description: string): ICrate {
    return {
        "@context": DEFAULT_CONTEXT,
        "@graph": [
            {
                "@id": "./",
                "@type": "Dataset",
                name,
                description
            },
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                about: { "@id": "./" },
                conformsTo: { "@id": DEFAULT_CONFORMS_TO }
            }
        ]
    }
}

/**
 * Factory for creating new crates. Composes {@link IRepositoryService} primitives
 * with RO-Crate metadata knowledge to provide higher-level creation workflows.
 *
 * The repository service itself stays metadata-agnostic — all crate structure
 * knowledge lives here.
 */
export class CrateFactory {
    constructor(private persistence: IPersistenceService) {}

    private getRepository(): IRepositoryService {
        const repo = this.persistence.getRepositoryService()
        if (!repo) throw new Error("Repository service is not available")
        return repo
    }

    private crateMetadataSchema = z.object({
        "@context": z.union([z.string(), z.object(), z.array(z.union([z.string(), z.object()]))]),
        "@graph": z.array(z.object())
    })

    /**
     * Create an empty crate with the standard RO-Crate v1.2 template.
     * @returns The crate ID of the newly created crate.
     */
    async createEmptyCrate(name: string, description: string): Promise<string> {
        const crate = buildCrateTemplate(name, description)
        const json = JSON.stringify(crate, null, 2)
        return this.getRepository().createCrateFromMetadata(json)
    }

    /**
     * Auto-detect the packaging format and create a crate from it.
     * Supports zip archives and JSON/JSON-LD metadata files.
     * For uploading normal files, use {@link createCrateFromFiles} instead.
     * @returns The crate ID of the newly created crate.
     */
    async createCrateFromFile(file: Blob): Promise<string> {
        if (file.type === "application/json" || file.type === "application/ld+json") {
            return this.createCrateFromMetadataFile(file)
        }

        // Default to zip for zip types and unknown types
        return this.getRepository().createCrateFromZip(file)
    }

    /**
     * Create a crate from a standalone ro-crate-metadata.json file.
     * Validates that the file contains valid JSON with {@code @context} and
     * {@code @graph} before writing.
     * @returns The crate ID of the newly created crate.
     */
    async createCrateFromMetadataFile(metadataFile: Blob): Promise<string> {
        const text = await metadataFile.text()

        let parsed: unknown
        try {
            parsed = JSON.parse(text)
        } catch {
            throw new Error("Invalid JSON in metadata file")
        }

        const result = this.crateMetadataSchema.safeParse(parsed)
        if (!result.success) {
            throw new Error("Invalid RO-Crate metadata: " + z.prettifyError(result.error))
        }

        return this.getRepository().createCrateFromMetadata(text)
    }

    /**
     * Create a crate populated with the given files.
     *
     * This creates an empty crate, opens it, then uploads each file and adds
     * corresponding File entities to the metadata.
     *
     * @param name Name for the crate root entity
     * @param description Description for the crate root entity
     * @param files Files to upload, each with a relative path and blob data
     * @param progressCallback Optional callback reporting upload progress
     * @returns The crate ID of the newly created crate.
     *
     * @startuml
     * activate CrateFactory
     * CrateFactory -> CrateFactory: createEmptyCrate(name, description)
     * CrateFactory -> PersistenceService: createCrateServiceFor(crateId)
     * activate PersistenceService
     * create CrateService
     * PersistenceService -> CrateService: <<new>>
     * activate CrateService
     * create FileService
     * CrateService -> FileService: <<new>>
     * return
     * return
     * CrateFactory -> CrateService ++: getFileService()
     * return
     * CrateFactory -> FileService ++: addFile(filePath, fileData)
     * return
     * CrateFactory -> CrateService ++: setMetadata(metadata)
     * return
     * deactivate CrateFactory
     * @enduml
     */
    async createCrateFromFiles(
        name: string,
        description: string,
        files: { relativePath: string; data: Blob }[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ): Promise<string> {
        const crateId = await this.createEmptyCrate(name, description)

        const crateService = await this.persistence.createCrateServiceFor(crateId)
        if (!crateService) {
            throw new Error("Crate services not available, cannot create files")
        }

        const fileService = crateService.getFileService()

        const errors: string[] = []
        let progress = 0

        // Read the current metadata so we can add entities
        const rawMetadata = await crateService.getMetadata()
        const crate = JSON.parse(rawMetadata) as ICrate
        const rootID = getRootEntityID(crate["@graph"])
        const root = rootID && crate["@graph"].find((e) => e["@id"] === rootID)
        if (!root) {
            throw new Error("Root entity not found in metadata")
        }

        // Stable sort for deterministic ordering
        const sorted = [...files].sort((a, b) =>
            extractFileName(a.relativePath).localeCompare(extractFileName(b.relativePath))
        )

        for (const file of sorted) {
            const filePath = normalizeRelativePath(file.relativePath)
            try {
                if (fileService) {
                    await fileService.addFile(filePath, file.data)
                }

                const fileName = extractFileName(filePath)
                crate["@graph"].push({
                    "@id": filePath,
                    "@type": "File",
                    name: fileName,
                    contentSize: file.data.size + "",
                    encodingFormat: file.data.type || undefined
                } as IEntity)

                if (!root.hasPart) root.hasPart = []
                if (Array.isArray(root.hasPart)) {
                    root.hasPart.push({ "@id": filePath })
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                errors.push(`Failed to upload ${filePath}: ${msg}`)
            }

            progress++
            progressCallback?.(progress, sorted.length, errors)
        }

        // Write updated metadata with all new entities
        await crateService.setMetadata(JSON.stringify(crate, null, 2))

        return crateId
    }

    /**
     * Duplicate an existing crate by exporting it as a zip, modifying the
     * root entity name in the metadata, and importing the modified zip as a
     * new crate.
     *
     * @param crateId ID of the crate to duplicate
     * @param newName Name for the duplicate. Defaults to "Copy of <original name>".
     * @returns The crate ID of the newly created duplicate.
     */
    async duplicateCrate(crateId: string, newName?: string): Promise<string> {
        const repo = this.getRepository()

        const zipBlob = await repo.getCrateAs(crateId, "zip")
        const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer())

        const metadataEntry = zip.file("ro-crate-metadata.json")
        if (metadataEntry) {
            const metadataText = await metadataEntry.async("string")
            const crate = JSON.parse(metadataText) as ICrate

            const rootID = getRootEntityID(crate["@graph"])
            const root = rootID && crate["@graph"].find((e) => e["@id"] === rootID)
            if (root) {
                const originalName = typeof root.name === "string" ? root.name : "Unnamed Crate"
                root.name = newName ?? `Copy of ${originalName}`
            }

            zip.file("ro-crate-metadata.json", JSON.stringify(crate, null, 2))
        }

        const modifiedZip = await zip.generateAsync({ type: "blob" })
        return repo.createCrateFromZip(modifiedZip)
    }
}

function normalizeRelativePath(relativePath: string): string {
    const parts = relativePath.split("/")
    // Strip leading directory (webkitRelativePath starts with folder name)
    if (parts.length > 1) parts[0] = "."
    return parts.join("/").replace(/^\.\//, "")
}

function extractFileName(path: string): string {
    const parts = path.split("/").filter((p) => p !== "")
    return parts[parts.length - 1]
}
