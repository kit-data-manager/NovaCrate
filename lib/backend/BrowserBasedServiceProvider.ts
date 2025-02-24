import autoBind from "auto-bind"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"

const template: (name: string, description: string) => ICrate = (
    name: string,
    description: string
) => ({
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": [
        {
            "@type": "Dataset",
            "@id": "./",
            name,
            description
        }
    ]
})

export class BrowserBasedServiceProvider implements CrateServiceProvider {
    private worker: FunctionWorker<typeof opfsFunctions>

    private localOpfsHealthy = true
    private workerOpfsHealthy = true

    constructor() {
        if (navigator && navigator.storage) {
            try {
                navigator.storage.getDirectory().then(() => {
                    console.log("OPFS available")
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

    createCrateFromCrateZip(zip: File): Promise<string> {
        throw "Not supported in browser-based environment yet"
    }

    createCrateFromFiles(
        name: string,
        description: string,
        files: File[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ): Promise<string> {
        throw "Not supported in browser-based environment yet"
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

    createFileEntity(crateId: string, entityData: IEntity, file: File): Promise<boolean> {
        throw "Not supported in browser-based environment yet"
    }

    async deleteCrate(id: string): Promise<boolean> {
        await opfsFunctions.deleteCrateDir(id)
        return true
    }

    async deleteEntity(crateId: string, entityData: IEntity): Promise<boolean> {
        throw "Not supported in browser-based environment yet"
    }

    downloadCrateZip(id: string): Promise<void> {
        throw "Not supported in browser-based environment yet"
    }

    downloadFile(crateId: string, filePath: string): Promise<void> {
        throw "Not supported in browser-based environment yet"
    }

    downloadRoCrateMetadataJSON(id: string): Promise<void> {
        throw "Not supported in browser-based environment yet"
    }

    async getCrate(id: string) {
        // We can safely run this in the main thread to safe worker overhead
        const data = await opfsFunctions.readFile(id, "ro-crate-metadata.json")
        return JSON.parse(data) as ICrate
    }

    getCrateFilesList(crateId: string): Promise<string[]> {
        throw "Not supported in browser-based environment yet"
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
}
