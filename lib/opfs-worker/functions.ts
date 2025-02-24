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
    console.log(parts[parts.length - 1])
    return dir.getFileHandle(parts[parts.length - 1], { create: true })
}

async function resolveDirPath(crateId: string, filePath: string) {
    const parts = filePath.split("/")
    console.log(crateId, filePath)

    let base = await getCrateDir(crateId)
    if (filePath === "") return base

    for (let i = 0; i < parts.length; i++) {
        console.log(parts[i])
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
    console.log("Write completed successfully")
}

export async function readFile(crateId: string, filePath: string) {
    const metadataFile = await resolveFilePath(crateId, filePath)

    const file = await metadataFile.getFile()
    return await file.text()
}

export async function getCrateDirContents(crateId: string, dirPath: string) {
    const dir = await resolveDirPath(crateId, dirPath)

    const entries: { name: string; type: FileSystemHandleKind }[] = []
    for await (const file of dir) {
        entries.push({ name: file[0], type: file[1].kind })
    }

    return entries
}

export async function getCrates() {
    const dir = await getCrateStorageDir()

    const entries: string[] = []
    for await (const file of dir.keys()) {
        entries.push(file)
    }

    return entries
}

export const opfsFunctions = {
    writeFile,
    readFile,
    getCrates,
    deleteCrateDir
}
