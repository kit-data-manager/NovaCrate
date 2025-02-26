import * as fs from "happy-opfs"

async function getCrateStorageDir() {
    const fileSystemHandle = await navigator.storage.getDirectory()
    return await fileSystemHandle.getDirectoryHandle("crate-storage", { create: true })
}

async function getCrateDir(id: string) {
    const crateStorage = await getCrateStorageDir()
    return await crateStorage.getDirectoryHandle(id, { create: true })
}

async function deleteCrateDir(id: string) {
    const crateStorage = await getCrateStorageDir()
    await crateStorage.removeEntry(id, { recursive: true })
}

async function resolveFilePath(crateId: string, filePath: string) {
    const parts = filePath.split("/")
    const dir = await resolveDirPath(crateId, parts.slice(0, parts.length - 1).join("/"))
    return dir.getFileHandle(parts[parts.length - 1], { create: true })
}

async function resolveDirPath(crateId: string, filePath: string) {
    const parts = filePath.split("/")

    let base = await getCrateDir(crateId)
    if (filePath === "") return base

    for (let i = 0; i < parts.length; i++) {
        base = await base.getDirectoryHandle(parts[i])
    }

    return base
}

export async function writeFile(crateId: string, filePath: string, data: Uint8Array) {
    const metadataFile = await resolveFilePath(crateId, filePath)

    const handle = await metadataFile.createSyncAccessHandle()
    handle.truncate(0)
    const written = handle.write(data)
    handle.close()

    if (written !== data.byteLength) throw "Partial write detected"
}

export async function readFile(crateId: string, filePath: string) {
    const metadataFile = await resolveFilePath(crateId, filePath)
    return await metadataFile.getFile()
}

export async function getCrateDirContents(crateId: string) {
    const dir = await getCrateDir(crateId)

    const stack: { handle: FileSystemDirectoryHandle; path: string[] }[] = [
        { handle: dir, path: [""] }
    ]
    const entries: { name: string; type: FileSystemHandleKind; path: string[] }[] = []

    const iterate = async (target: FileSystemDirectoryHandle, path: string[]) => {
        for await (const [name, handle] of target) {
            entries.push({ name: name, type: handle.kind, path })
            if (handle.kind === "directory")
                stack.push({ handle: handle as FileSystemDirectoryHandle, path: path.concat(name) })
        }
    }

    while (stack.length > 0) {
        const entry = stack.shift()!
        await iterate(entry.handle, entry.path)
    }

    return entries.map(
        (entry) =>
            entry.path.join("/") +
            (entry.path.join("/").length > 0 ? "/" : "") +
            entry.name +
            (entry.type === "directory" ? "/" : "")
    )
}

export async function getCrates() {
    const dir = await getCrateStorageDir()

    const entries: string[] = []
    for await (const file of dir.keys()) {
        entries.push(file)
    }

    return entries
}

export async function createCrateZip(crateId: string) {
    const result = await fs.zip(`/crate-storage/${crateId}`, { preserveRoot: false })
    if (result.isOk()) {
        const zip = result.unwrap()
        return new Blob([zip], { type: "application/zip" })
    } else {
        console.error(result.unwrapErr())
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
    createCrateZip
}
