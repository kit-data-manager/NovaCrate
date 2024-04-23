import { isContextualEntity, isFolderDataEntity, isRootEntity } from "@/lib/utils"

export class RestProvider implements CrateServiceProvider {
    createCrateFromFilesZip(id: string, zip: Buffer): Promise<void> {
        return Promise.resolve(undefined)
    }

    getCrateFileURL(crateId: string, filePath: string): Promise<string> {
        return Promise.resolve("")
    }

    getCrateFileWithData(crateId: string, filePath: string): Promise<ICrateFileWithData> {
        return Promise.resolve({
            filePath: "Not Implemented! ~rest-provider",
            size: 0,
            sha256: "",
            data: new ArrayBuffer(0)
        })
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
        return Promise.resolve({ "@id": "Not Implemented! ~rest-provider", "@type": [] })
    }

    async updateEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        const part = isRootEntity(entityData)
            ? "root"
            : isContextualEntity(entityData)
              ? "contextual"
              : isFolderDataEntity(entityData)
                ? "data/datasets"
                : "data/files"
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(crateId)}/entities/${part}/${encodeURIComponent(entityData["@id"])}`,
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
