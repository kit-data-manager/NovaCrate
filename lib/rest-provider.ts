import { isContextualEntity, isFolderDataEntity, isRootEntity } from "@/lib/utils"

export class RestProvider implements CrateServiceProvider {
    createCrateFromFilesZip(id: string, zip: Buffer): Promise<void> {
        throw "Not implemented"
    }

    getCrateFileURL(crateId: string, filePath: string): Promise<string> {
        throw "Not implemented"
    }

    getCrateFileWithData(crateId: string, filePath: string): Promise<ICrateFileWithData> {
        throw "Not implemented"
    }

    renameEntity(crateId: string, oldEntityId: string, newEntityId: string): Promise<boolean> {
        throw "Not implemented"
    }

    uploadCrateFileWithData(crateId: string, file: ICrateFileWithData): boolean {
        throw "Not implemented"
    }

    uploadCrateFileZip(crateId: string, zip: Buffer): boolean {
        throw "Not implemented"
    }

    createCrate(id: string): Promise<void> {
        throw "Not implemented"
    }

    createCrateFromCrateZip(zip: Buffer): Promise<void> {
        throw "Not implemented"
    }

    createEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        return this.updateEntity(crateId, entityData, true)
    }

    deleteCrate(id: string): Promise<boolean> {
        throw "Not implemented"
    }

    async deleteEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        const request = await fetch(this.getEntityRoute(crateId, entityData), {
            method: "DELETE"
        })
        if (request.ok) {
            return true
        } else {
            throw "Failed to delete crate: " + request.status
        }
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
        throw "Not implemented"
    }

    getCrateUndeclaredFilesList(crateId: string): Promise<ICrateFile[]> {
        throw "Not implemented"
    }

    getEntity(crateId: string, entityId: string): Promise<IFlatEntity> {
        throw "Not implemented"
    }

    async updateEntity(
        crateId: string,
        entityData: IFlatEntity,
        create: boolean = false
    ): Promise<boolean> {
        const request = await fetch(this.getEntityRoute(crateId, entityData), {
            body: JSON.stringify(entityData),
            method: create ? "PUT" : "PATCH",
            headers: { "Content-Type": "application/json" }
        })
        if (request.ok) {
            return true
        } else {
            throw "Failed to get crate: " + request.status
        }
    }

    private getEntityRoutePart(entityData: IFlatEntity) {
        return isRootEntity(entityData)
            ? "root"
            : isContextualEntity(entityData)
              ? "contextual"
              : isFolderDataEntity(entityData)
                ? "data/datasets"
                : "data/files"
    }

    private getEntityRoute(crateId: string, entityData: IFlatEntity) {
        const part = this.getEntityRoutePart(entityData)
        return `http://localhost:8080/crates/${encodeURIComponent(crateId)}/entities/${part}/${encodeURIComponent(entityData["@id"])}`
    }
}
