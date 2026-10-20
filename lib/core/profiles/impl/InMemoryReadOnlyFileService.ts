import { IReadOnlyFileService } from "@/lib/core/persistence/IReadOnlyFileService"
import { IFileInfo } from "@/lib/core/persistence"

/**
 * Read-only {@link IReadOnlyFileService} backed by an in-memory map of paths to blobs.
 * Used by the profile factory when a profile crate is fetched over the network, so
 * that profile strategies can access files from the resolved crate.
 */
export class InMemoryReadOnlyFileService implements IReadOnlyFileService {
    private files: Map<string, Blob>
    private infos: IFileInfo[]

    constructor(entries: { path: string; content: Blob }[]) {
        this.files = new Map()
        const infos: IFileInfo[] = []
        const dirSet = new Set<string>()
        for (const entry of entries) {
            const normalized = normalizePath(entry.path)
            this.files.set(normalized, entry.content)
            infos.push({ type: "file", name: basename(normalized), path: normalized })
            for (const dir of parentDirs(normalized)) {
                if (!dirSet.has(dir)) {
                    dirSet.add(dir)
                    infos.push({ type: "directory", name: basename(dir), path: dir })
                }
            }
        }
        infos.sort((a, b) => a.path.localeCompare(b.path))
        this.infos = infos
    }

    async getFile(path: string): Promise<Blob> {
        const normalized = normalizePath(path)
        const blob = this.files.get(normalized)
        if (!blob) {
            throw new Error(`File not found in profile crate: ${path}`)
        }
        return blob
    }

    async getInfo(path: string): Promise<IFileInfo> {
        const normalized = normalizePath(path)
        const info = this.infos.find((i) => i.path === normalized)
        if (!info) {
            throw new Error(`File or directory not found in profile crate: ${path}`)
        }
        return info
    }

    async getContentList(): Promise<IFileInfo[]> {
        return structuredClone(this.infos)
    }
}

function normalizePath(path: string): string {
    return path.replace(/^\.\//, "").replace(/^\//, "")
}

function basename(path: string): string {
    const parts = path.split("/")
    return parts[parts.length - 1] || path
}

function* parentDirs(path: string): Generator<string> {
    const parts = path.split("/").slice(0, -1)
    let acc = ""
    for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part
        yield acc
    }
}
