import * as fs from "happy-opfs"
import { collectAsyncIterator } from "./helpers"

const CRATE_STORAGE = "crate-storage" as const

function resolveCratePath(crateId: string, path?: string) {
    if (path?.startsWith("./")) path = path.slice(2)
    if (path?.startsWith("/")) path = path.slice(1)

    return `/${CRATE_STORAGE}/${crateId}` + (path ? `/${path}` : "")
}

async function deleteCrateDir(id: string) {
    const result = await fs.remove(resolveCratePath(id))
    if (!result.isOk()) throw result.unwrapErr()
}

export async function writeFile(crateId: string, filePath: string, data: Uint8Array | Blob) {
    const result = await fs.writeFile(resolveCratePath(crateId, filePath), data)

    if (result.isErr()) throw result.unwrapErr()
}

export async function readFile(crateId: string, filePath: string) {
    const result = await fs.readFile(resolveCratePath(crateId, filePath), { encoding: "blob" })
    if (result.isOk()) {
        return result.unwrap()
    } else {
        throw result.unwrapErr()
    }
}

export async function deleteFileOrFolder(crateId: string, filePath: string) {
    const exists = await fs.exists(resolveCratePath(crateId, filePath))
    if (!exists.isOk()) throw exists.unwrapErr()

    // Fail silently if file does not exist
    if (!exists.unwrap()) return

    const result = await fs.remove(resolveCratePath(crateId, filePath))
    if (!result.isOk()) throw result.unwrapErr()
}

export async function getCrateDirContents(crateId: string) {
    // First, check if crate storage dir exists and create it if not
    const crateDirExists = await fs.exists(resolveCratePath(crateId, crateId))
    if (!crateDirExists.isOk) throw crateDirExists.unwrapErr()
    else if (!crateDirExists.unwrap()) {
        const mkdirResult = await fs.mkdir(resolveCratePath(crateId, crateId))
        if (!mkdirResult.isOk()) throw mkdirResult.unwrapErr()
    }

    const result = await fs.readDir(resolveCratePath(crateId), { recursive: true })
    if (!result.isOk()) throw result.unwrapErr()

    const iterator = result.unwrap()
    const contents: string[] = []

    for await (const entry of iterator) {
        if (entry.path === crateId) continue
        if (entry.handle.kind === "directory") {
            contents.push(entry.path + "/")
        } else {
            contents.push(entry.path)
        }
    }

    // OPFS scrambles some UTF-8 names, so we normalize them here
    return contents.map((s) => s.normalize())
}

export async function getCrates() {
    const result = await fs.readDir(`/${CRATE_STORAGE}`)
    if (!result.isOk()) throw result.unwrapErr()

    const iterator = result.unwrap()
    const crateIds: string[] = []

    for await (const entry of iterator) {
        crateIds.push(entry.handle.name)
    }

    return crateIds
}

export async function createCrateZip(crateId: string) {
    const result = await fs.zip(resolveCratePath(crateId), { preserveRoot: false })
    if (result.isOk()) {
        const zip = result.unwrap()
        return new Blob([zip], { type: "application/zip" })
    } else {
        throw result.unwrapErr()
    }
}

export async function createCrateEln(crateId: string) {
    const result = await fs.zip(resolveCratePath(crateId), { preserveRoot: true })
    if (result.isOk()) {
        const zip = result.unwrap()
        return new Blob([zip], { type: "application/vnd.eln+zip" })
    } else {
        throw result.unwrapErr()
    }
}

export async function createCrateFromZip(zip: Blob) {
    const id = crypto.randomUUID()

    // We first have to write the zip file to OPFS before unzipping
    const tmpZip = await fs.mkTemp({
        basename: id,
        extname: "zip"
    })
    if (!tmpZip.isOk()) throw tmpZip.unwrapErr()

    const zipWrite = await fs.writeFile(tmpZip.unwrap(), zip)
    if (!zipWrite.isOk()) throw zipWrite.unwrapErr()

    const result = await fs.unzip(tmpZip.unwrap(), resolveCratePath(id))
    if (!result.isOk()) throw result.unwrapErr()

    fs.pruneTemp(new Date()).then()

    const readDirResult = await fs.readDir(resolveCratePath(id))
    if (!readDirResult.isOk()) throw readDirResult.unwrapErr()

    const files = await collectAsyncIterator(readDirResult.unwrap())
    if (files.length === 0) throw "Crate archive is empty"

    if (files.find((file) => file.path === "ro-crate-metadata.json")) {
        return id
    } else if (
        files.length === 1 &&
        files.filter((f) => f.handle.kind === "directory").length === 1
    ) {
        // ELN Format has one single folder in root that contains the crate
        const subFolder = files.find((f) => f.handle.kind === "directory")
        if (!subFolder) throw "Could not find subFolder"

        const moveResult = await fs.move(
            resolveCratePath(id) + "/" + subFolder.path,
            resolveCratePath(id),
            { overwrite: true }
        )
        if (!moveResult.isOk()) throw moveResult.unwrapErr()

        return id
    } else {
        throw "Could not find crate root. Make sure the ro-crate-metadata.json file is in the root directory."
    }
}

export async function getStorageInfo(): Promise<{
    usedSpace: number
    totalSpace: number
    persistent: boolean
}> {
    const quota = await navigator.storage.estimate()
    const persistent = await navigator.storage.persisted()

    return { persistent, totalSpace: quota.quota ?? quota.usage ?? 0, usedSpace: quota.usage ?? 0 }
}

export const opfsFunctions = {
    writeFile,
    readFile,
    getCrates,
    deleteCrateDir,
    getCrateDirContents,
    getStorageInfo,
    createCrateZip,
    createCrateFromZip,
    deleteFileOrFolder,
    createCrateEln
}
