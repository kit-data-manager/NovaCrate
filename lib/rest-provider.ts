import { isContextualEntity, isDataEntity, isFolderDataEntity, isRootEntity } from "@/lib/utils"
import fileDownload from "js-file-download"
import { handleSpringError } from "@/lib/spring-error-handling"

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

    getCrateFileURL(crateId: string, filePath: string): string {
        return `http://localhost:8080/crates/${encodeURIComponent(crateId)}/files/${encodeURIComponent(filePath)}`
    }

    getCrateFileWithData(crateId: string, filePath: string): Promise<File> {
        throw "Not implemented"
    }

    renameEntity(crateId: string, oldEntityId: string, newEntityId: string): Promise<boolean> {
        throw "Not implemented"
    }

    async createCrate(name: string, description: string) {
        const request = await fetch("http://localhost:8080/crates", {
            method: "PUT",
            body: JSON.stringify({ name, description }),
            headers: { "Content-Type": "application/json" }
        })
        if (request.ok) {
            const response = await request.json()
            return response.id + ""
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async createCrateFromCrateZip(zip: File) {
        if (zip.type !== "application/zip" && zip.type !== "application/x-zip-compressed")
            throw "Unsupported file type " + zip.type
        const body = new FormData()
        body.append("file", zip)

        const request = await fetch("http://localhost:8080/crates", {
            method: "PUT",
            body
        })
        if (request.ok) {
            const response = await request.json()
            return response.id + ""
        } else {
            throw handleSpringError(await request.json())
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
            throw handleSpringError(await request.json())
        }
    }

    async deleteCrate(id: string): Promise<boolean> {
        const request = await fetch("http://localhost:8080/crates/" + id, {
            method: "DELETE"
        })
        if (request.ok) {
            return true
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async deleteEntity(crateId: string, entityData: IFlatEntity): Promise<boolean> {
        const request = await fetch(this.getEntityRoute(crateId, entityData), {
            method: "DELETE"
        })
        if (request.ok) {
            return true
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async downloadCrateZip(id: string) {
        const request = await fetch(`http://localhost:8080/crates/${id}`)
        if (request.ok) {
            fileDownload(await request.arrayBuffer(), `${id}.zip`, "application/zip")
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async downloadRoCrateMetadataJSON(id: string) {
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(id)}/files/ro-crate-metadata.json`
        )
        if (request.ok) {
            fileDownload(await request.arrayBuffer(), "ro-crate-metadata.json", "application/json")
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async downloadFile(crateId: string, filePath: string) {
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(crateId)}/files/${filePath}`
        )
        if (request.ok) {
            const filePathSplit = filePath.split("/")
            fileDownload(await request.arrayBuffer(), filePathSplit[filePathSplit.length - 1])
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async getCrate(id: string): Promise<ICrate> {
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(id)}/files/ro-crate-metadata.json`
        )
        if (request.ok) {
            return await request.json()
        } else {
            throw handleSpringError(await request.json())
        }
    }

    async getCrateFilesList(crateId: string): Promise<string[]> {
        const request = await fetch(
            `http://localhost:8080/crates/${encodeURIComponent(crateId)}/files/`
        )
        if (request.ok) {
            return await request.json()
        } else {
            throw handleSpringError(await request.json())
        }
    }

    getEntity(crateId: string, entityId: string): Promise<IFlatEntity> {
        throw "Not implemented"
    }

    async updateEntity(
        crateId: string,
        entityData: IFlatEntity,
        create: boolean = false
    ): Promise<boolean> {
        if (isDataEntity(entityData) && !isRootEntity(entityData)) {
            const formData = new FormData()
            formData.append(
                "metadata",
                new Blob([JSON.stringify(entityData)], { type: "application/json" })
            )
            const request = await fetch(this.getEntityRoute(crateId, entityData), {
                body: formData,
                method: "PUT"
            })
            if (request.ok) {
                return true
            } else {
                throw handleSpringError(await request.json())
            }
        } else {
            const request = await fetch(this.getEntityRoute(crateId, entityData), {
                body: JSON.stringify(entityData),
                method: /*create ?*/ "PUT" /*: "PATCH"*/,
                headers: { "Content-Type": "application/json" }
            })
            if (request.ok) {
                return true
            } else {
                throw handleSpringError(await request.json())
            }
        }
    }

    async getStoredCrateIds() {
        const request = await fetch("http://localhost:8080/crates")
        if (request.ok) {
            const response = await request.json()
            return response as string[]
        } else {
            throw handleSpringError(await request.json())
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
