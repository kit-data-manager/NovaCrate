import autoBind from "auto-bind"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"
import fileDownload from "js-file-download"
import { handleSpringError } from "@/lib/spring-error-handling"

const template: (name: string, description: string) => ICrate = (
    name: string,
    description: string
) =>
    ({
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": [
            {
                "@id": "./",
                "@type": "Dataset",
                name: name,
                description: description
            },
            {
                about: {
                    "@id": "./"
                },
                conformsTo: {
                    "@id": "https://w3id.org/ro/crate/1.1"
                },
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork"
            }
        ]
    }) as ICrate

export class BrowserBasedServiceProvider implements CrateServiceProvider {
    private worker: FunctionWorker<typeof opfsFunctions>

    private localOpfsHealthy = true
    private workerOpfsHealthy = true

    constructor() {
        if (navigator && navigator.storage) {
            try {
                navigator.storage.getDirectory().then(() => {
                    console.log("OPFS available")

                    navigator.storage.persisted().then((result) => {
                        console.log(`Persist is ${result ? "" : "not"} enabled`)
                        if (!result)
                            navigator.storage.persist().then((result) => {
                                console.log(
                                    `Requested to persist storage: ${result ? "Success" : "Failed"}`
                                )
                            })
                    })
                })
            } catch (e) {
                console.error("Exception while trying to initialize OPFS", e)
                this.localOpfsHealthy = false
            }
        }

        this.worker = new FunctionWorker(opfsFunctions)
        this.worker.mount("/opfs-worker.js")

        autoBind(this)
    }

    async createCrate(name: string, description: string) {
        const id = crypto.randomUUID()
        const crate = template(name, description)

        await this.saveRoCrateMetadataJSON(id, JSON.stringify(crate))
        return id
    }

    async createCrateFromCrateZip(zip: File) {
        return this.worker.execute("createCrateFromZip", zip)
    }

    async createCrateFromFiles(
        name: string,
        description: string,
        files: File[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ) {
        const errors: string[] = []
        const id = await this.createCrate(name, description)
        progressCallback?.(0, files.length, errors)

        for (const file of files) {
            const pathSplit = file.webkitRelativePath.split("/")
            if (pathSplit.length > 1) pathSplit[0] = "."
            try {
                await this.createFileEntity(
                    id,
                    {
                        "@id": pathSplit.join("/").slice(2),
                        "@type": "File",
                        name: pathSplit[pathSplit.length - 1]
                    },
                    file
                )
            } catch (e) {
                console.error(e)
                errors.push(handleSpringError(e))
            }

            progressCallback?.(files.indexOf(file) + 1, files.length, errors)
        }

        return id
    }

    async createEntity(crateId: string, entityData: IEntity) {
        const crate = await this.getCrate(crateId)
        const existing = crate["@graph"].find((n) => n["@id"] === entityData["@id"])
        if (existing) {
            return false
        }

        crate["@graph"].push(entityData)

        await this.saveRoCrateMetadataJSON(crateId, JSON.stringify(crate))
        return true
    }

    async createFileEntity(crateId: string, entityData: IEntity, file: File) {
        const entityCreated = await this.createEntity(crateId, {
            ...entityData,
            contentSize: file.size + "",
            encodingFormat: file.type
        })

        if (entityCreated) {
            await this.worker.execute("writeFile", crateId, entityData["@id"], file)
            return true
        } else throw "Could not create entity"
    }

    async deleteCrate(id: string): Promise<boolean> {
        await opfsFunctions.deleteCrateDir(id)
        return true
    }

    async deleteEntity(crateId: string, entityData: IEntity): Promise<boolean> {
        const crate = await this.getCrate(crateId)
        const existing = crate["@graph"].findIndex((n) => n["@id"] === entityData["@id"])
        if (existing >= 0) {
            crate["@graph"].splice(existing, 1)
        }

        await this.saveRoCrateMetadataJSON(crateId, JSON.stringify(crate))
        await this.worker.execute("deleteFileOrFolder", crateId, entityData["@id"])
        return true
    }

    async downloadCrateZip(id: string) {
        const crate = await this.getCrate(id)
        const root = crate["@graph"].find((n) => n["@id"] === "./")
        const name = root?.name ?? "crate-export"

        const blob = await this.worker.execute("createCrateZip", id)
        if (blob) {
            fileDownload(blob, `${name}.zip`, "application/zip")
        } else {
            throw "Zip file was not created"
        }
    }

    async downloadFile(crateId: string, filePath: string) {
        const data = await opfsFunctions.readFile(crateId, filePath)
        fileDownload(data, filePath.split("/").pop() ?? "unnamed")
    }

    async downloadRoCrateMetadataJSON(id: string) {
        await this.downloadFile(id, "ro-crate-metadata.json")
    }

    async getCrate(id: string) {
        // We can safely run this in the main thread to safe worker overhead
        const data = await opfsFunctions.readFile(id, "ro-crate-metadata.json")
        return JSON.parse(await data.text()) as ICrate
    }

    async getCrateFilesList(crateId: string) {
        return await opfsFunctions.getCrateDirContents(crateId)
    }

    async getStoredCrateIds() {
        return await this.worker.execute("getCrates")
    }

    async healthCheck() {
        const healthy = await this.worker.healthTest()

        if (!healthy) {
            this.workerOpfsHealthy = false
            throw "OPFS worker not healthy"
        } else {
            this.workerOpfsHealthy = true
        }
    }

    importEntityFromOrcid(crateId: string, url: string): Promise<string> {
        throw "Not supported in browser-based environment yet"
    }

    importOrganizationFromRor(crateId: string, url: string): Promise<string> {
        throw "Not supported in browser-based environment yet"
    }

    addCustomContextPair(crateId: string, key: string, value: string): Promise<void> {
        throw "Not supported in browser-based environment yet"
    }

    removeCustomContextPair(crateId: string, key: string): Promise<void> {
        throw "Not supported in browser-based environment yet"
    }

    async saveRoCrateMetadataJSON(crateId: string, json: string): Promise<void> {
        const data = new TextEncoder().encode(json)
        await this.worker.executeTransfer(
            "writeFile",
            [data.buffer],
            crateId,
            "ro-crate-metadata.json",
            data
        )
    }

    async updateEntity(crateId: string, entityData: IEntity): Promise<boolean> {
        const crate = await this.getCrate(crateId)
        const existing = crate["@graph"].find((n) => n["@id"] === entityData["@id"])

        if (existing) {
            for (const [key, value] of Object.entries(entityData)) {
                if (value === null && key in existing) {
                    delete existing[key]
                } else {
                    existing[key] = value
                }
            }
        } else {
            crate["@graph"].push(entityData)
        }

        await this.saveRoCrateMetadataJSON(crateId, JSON.stringify(crate))
        return true
    }

    getStorageInfo() {
        return opfsFunctions.getStorageInfo()
    }

    async getCrateFileURL(crateId: string, filePath: string) {
        const file = await this.worker.execute("readFile", crateId, filePath)
        return URL.createObjectURL(file)
    }
}
