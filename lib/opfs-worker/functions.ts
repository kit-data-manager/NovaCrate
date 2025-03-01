import * as fs from "happy-opfs"

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

export async function writeFile(crateId: string, filePath: string, data: Uint8Array) {
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

export async function getCrateDirContents(crateId: string) {
    const result = await fs.readDir(resolveCratePath(crateId), { recursive: true })
    if (!result.isOk()) throw result.unwrapErr()

    const iterator = result.unwrap()
    const contents: string[] = []

    for await (const entry of iterator) {
        contents.push(entry.path)
    }

    return contents
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

export async function createCrateFromZip(zip: File) {
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

    fs.pruneTemp(new Date())

    return id
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
    createCrateFromZip
}
