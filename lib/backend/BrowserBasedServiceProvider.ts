let demoCrate: ICrate = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": [
        {
            "@type": "Dataset",
            "@id": "./"
        }
    ]
}

let localCrates: Record<string, ICrate> = {
    democrate: demoCrate
}

export class BrowserBasedServiceProvider implements CrateServiceProvider {
    async createCrate(name: string, description: string) {
        const id = crypto.randomUUID()
        localCrates[id] = { ...demoCrate }
        let created = localCrates[id]["@graph"].find((n) => n["@id"] === "./")

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
        const crate = await this.getCrate(crateId)

        const existingIndex = crate["@graph"].findIndex(
            (existing) => existing["@id"] === entityData["@id"]
        )
        if (existingIndex >= 0) throw "Entity with the same id already exists"

        crate["@graph"].push(entityData)

        console.log(
            Object.getOwnPropertyDescriptors(
                crate["@graph"].find((n) => n["@id"] === entityData["@id"])
            )
        )

        return true
    }

    createFileEntity(crateId: string, entityData: IEntity, file: File): Promise<boolean> {
        throw "Not supported in browser-based environment yet"
    }

    async deleteCrate(id: string) {
        if (id in localCrates) {
            delete localCrates[id]
            return true
        } else throw "Crate not found"
    }

    async deleteEntity(crateId: string, entityData: IEntity) {
        const crate = await this.getCrate(crateId)
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
        if (id in localCrates) return localCrates[id]
        else throw "Crate not found"
    }

    getCrateFilesList(crateId: string): Promise<string[]> {
        throw "Not supported in browser-based environment yet"
    }

    async getStoredCrateIds() {
        return Object.keys(localCrates)
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
        const crate = await this.getCrate(crateId)
        let entity = crate["@graph"].find((n) => n["@id"] === entityData["@id"])

        if (!entity) throw "Entity not found"

        console.log(Object.getOwnPropertyDescriptors(entity))

        for (const [key, value] of Object.entries(entityData)) {
            if (value === null && key in entity) {
                delete entity[key]
            } else if (value !== null) {
                try {
                    entity[key] = value
                } catch (e) {
                    console.error(e, key, value, Object.getOwnPropertyDescriptors(entity))
                }
            }
        }

        return true
    }
}
