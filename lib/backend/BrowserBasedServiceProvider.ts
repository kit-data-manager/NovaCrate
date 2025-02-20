import autoBind from "auto-bind"

const demoCrate: ICrate = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": [
        {
            "@type": "Dataset",
            "@id": "./"
        }
    ]
}

export class BrowserBasedServiceProvider implements CrateServiceProvider {
    localCrates: Record<string, ICrate> = {
        democrate: { ...demoCrate }
    }

    constructor() {
        autoBind(this)
    }

    async createCrate(name: string, description: string) {
        const id = crypto.randomUUID()
        this.localCrates[id] = { ...demoCrate }
        let created = this.localCrates[id]["@graph"].find((n) => n["@id"] === "./")

        if (created) {
            created.description = description
            created.name = name
        }

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
        const crate = this.getCrateInternal(crateId)

        const existingIndex = crate["@graph"].findIndex(
            (existing) => existing["@id"] === entityData["@id"]
        )
        if (existingIndex >= 0) throw "Entity with the same id already exists"

        crate["@graph"].push(structuredClone(entityData))
        return true
    }

    createFileEntity(crateId: string, entityData: IEntity, file: File): Promise<boolean> {
        throw "Not supported in browser-based environment yet"
    }

    async deleteCrate(id: string) {
        if (id in this.localCrates) {
            delete this.localCrates[id]
            return true
        } else throw "Crate not found"
    }

    async deleteEntity(crateId: string, entityData: IEntity) {
        const crate = this.getCrateInternal(crateId)
        const existingIndex = crate["@graph"].findIndex(
            (existing) => existing["@id"] === entityData["@id"]
        )

        if (existingIndex < 0) throw "Entity not found"

        crate["@graph"].splice(existingIndex, 1)

        return true
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
        return structuredClone(this.getCrateInternal(id))
    }

    private getCrateInternal(id: string) {
        if (id in this.localCrates) return this.localCrates[id]
        else throw "Crate not found"
    }

    getCrateFilesList(crateId: string): Promise<string[]> {
        throw "Not supported in browser-based environment yet"
    }

    async getStoredCrateIds() {
        return Object.keys(this.localCrates)
    }

    async healthCheck() {
        return Promise.resolve()
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

    saveRoCrateMetadataJSON(crateId: string, json: string): Promise<void> {
        throw "Not supported in browser-based environment yet"
    }

    async updateEntity(crateId: string, entityData: IEntity) {
        const crate = this.getCrateInternal(crateId)
        const entity = crate["@graph"].find((n) => n["@id"] === entityData["@id"])

        if (!entity) throw "Entity not found"

        for (const [key, value] of Object.entries(entityData)) {
            if (value === null && key in entity) {
                delete entity[key]
            } else if (value !== null) {
                entity[key] = value
            }
        }

        return true
    }
}
