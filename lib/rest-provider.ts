import { isContextualEntity, isFolderDataEntity, isRootEntity } from "@/lib/utils"
import fileDownload from "js-file-download"

export class RestProvider implements CrateServiceProvider {
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
                        "@id": pathSplit.join("/"),
                        "@type": "File",
                        name: pathSplit[pathSplit.length - 1]
                    },
                    file
                )
            } catch (e) {
                console.error(e)
                errors.push(typeof e === "object" && e ? e.toString() : e + "")
            }

            progressCallback?.(files.indexOf(file) + 1, files.length, errors)
        }

        return id
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

    uploadCrateFileZip(crateId: string, zip: File): boolean {
        throw "Not implemented"
    }

    async createCrate(name: string, description: string) {
        const request = await fetch("http://localhost:8080/crates/new", {
            method: "POST",
            body: JSON.stringify({ name, description }),
            headers: { "Content-Type": "application/json" }
        })
        if (request.ok) {
            const response = await request.json()
            return response.id + ""
        } else {
            throw "Failed to upload crate: " + request.status
        }
    }

    async createCrateFromCrateZip(zip: File) {
        if (zip.type !== "application/zip") throw "Unsupported file type " + zip.type
        const body = new FormData()
        body.append("file", zip)

        const request = await fetch("http://localhost:8080/crates", {
            method: "POST",
            body
        })
        if (request.ok) {
            const response = await request.json()
            return response.id + ""
        } else {
            throw "Failed to upload crate: " + request.status
        }
    }

    createEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        return this.updateEntity(crateId, entityData, true)
    }

    async createFileEntity(crateId: string, entityData: IFlatEntity, file: File) {
        const body = new FormData()

        body.append(
            "metadata",
            new Blob([JSON.stringify(entityData)], { type: "application/json" })
        )
        body.append("file", file)

        const request = await fetch(this.getEntityRoute(crateId, entityData), {
            body,
            method: "PUT"
        })
        if (request.ok) {
            return true
        } else {
            throw "Failed to create file entity: " + request.status
        }
    }

    async deleteCrate(id: string): Promise<boolean> {
        const request = await fetch("http://localhost:8080/crates/" + id, {
            method: "DELETE"
        })
        if (request.ok) {
            return true
        } else {
            throw "Failed to delete crate: " + request.status
        }
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

    async downloadCrateZip(id: string) {
        const request = await fetch(`http://localhost:8080/crates/${id}`)
        if (request.ok) {
            fileDownload(await request.arrayBuffer(), `${id}.zip`, "application/zip")
        } else {
            throw "Failed to download crate zip: " + request.status
        }
    }

    async downloadRoCrateMetadataJSON(id: string) {
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(id)}/ro-crate-metadata.json`
        )
        if (request.ok) {
            fileDownload(await request.arrayBuffer(), "ro-crate-metadata.json", "application/json")
        } else {
            throw "Failed to get crate: " + request.status
        }
    }

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

    // TODO properly handle data entities, route changed
    async updateEntity(
        crateId: string,
        entityData: IFlatEntity,
        create: boolean = false
    ): Promise<boolean> {
        const request = await fetch(this.getEntityRoute(crateId, entityData), {
            body: JSON.stringify(entityData),
            method: /*create ?*/ "PUT" /*: "PATCH"*/,
            headers: { "Content-Type": "application/json" }
        })
        if (request.ok) {
            return true
        } else {
            throw "Failed to get crate: " + request.status
        }
    }

    async getStoredCrateIds() {
        const request = await fetch("http://localhost:8080/crates")
        if (request.ok) {
            const response = await request.json()
            return response as string[]
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
