import { localCrates } from "@/lib/backend/browser-based/LocalCrate"

export class BrowserBasedServiceProvider implements CrateServiceProvider {
    createCrate(name: string, description: string): Promise<string> {
        throw "Not supported in browser-based environment yet"
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

    createEntity(crateId: string, entityData: IEntity): Promise<boolean> {
        throw "Not supported in browser-based environment yet"
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
        const existingIndex = crate["@graph"].findIndex(
            (existing) => existing["@id"] === entityData["@id"]
        )

        if (existingIndex < 0) throw "Entity not found"
        const entity = crate["@graph"][existingIndex]

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
