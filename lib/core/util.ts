import fileDownload from "js-file-download"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"

/**
 * Get a temporary object URL for a file in the crate.
 * The caller is responsible for revoking the URL with
 * {@link URL.revokeObjectURL} when it is no longer needed.
 */
export async function getFileAsURL(fileService: IFileService, path: string): Promise<string> {
    const blob = await fileService.getFile(path)
    return URL.createObjectURL(blob)
}

/**
 * Trigger a browser download for the given blob.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    fileDownload(blob, fileName)
}

/**
 * Export a crate in the given format and trigger a browser download.
 */
export async function downloadCrateAs(
    repositoryService: IRepositoryService,
    crateId: string,
    format: Parameters<IRepositoryService["getCrateAs"]>[1],
    fileName: string
): Promise<void> {
    const blob = await repositoryService.getCrateAs(crateId, format)
    downloadBlob(blob, fileName)
}
