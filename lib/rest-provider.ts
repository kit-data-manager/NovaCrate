export class RestProvider implements CrateServiceProvider {
    createCrateFromFilesZip(id: string, zip: Buffer): Promise<void> {
        return Promise.resolve(undefined)
    }

    getCrateFileURL(crateId: string, filePath: string): Promise<string> {
        return Promise.resolve("")
    }

    getCrateFileWithData(crateId: string, filePath: string): Promise<ICrateFileWithData> {
        return Promise.resolve(undefined)
    }

    renameEntity(crateId: string, oldEntityId: string, newEntityId: string): Promise<boolean> {
        return Promise.resolve(false)
    }

    uploadCrateFileWithData(crateId: string, file: ICrateFileWithData): boolean {
        return false
    }

    uploadCrateFileZip(crateId: string, zip: Buffer): boolean {
        return false
    }

    createCrate(id: string): Promise<void> {
        return Promise.resolve(undefined)
    }

    createCrateFromCrateZip(zip: Buffer): Promise<void> {
        return Promise.resolve(undefined)
    }

    createEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        return Promise.resolve(false)
    }

    deleteCrate(id: string): Promise<boolean> {
        return Promise.resolve(false)
    }

    deleteEntity(crateId: string, entityId: string): Promise<boolean> {
        return Promise.resolve(false)
    }

    downloadCrateZip(id: string): void {}

    async getCrate(id: string): Promise<ICrate> {
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(id)}/ro-crate-metadata.json`
        )
        if (request.ok) {
            return await request.json()
        } else {
            throw "Failed to get crate: " + request.status
        }
    }

    getCrateFilesList(crateId: string): Promise<ICrateFile[]> {
        return Promise.resolve([])
    }

    getEntity(crateId: string, entityId: string): Promise<IFlatEntity> {
        return Promise.resolve(undefined)
    }

    async updateEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        console.log(entityData)
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(crateId)}/entities/contextual/${encodeURIComponent(entityData["@id"])}`,
            {
                body: JSON.stringify(entityData),
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            }
        )
        if (request.ok) {
            return true
        } else {
            throw "Failed to get crate: " + request.status
        }
    }
}
