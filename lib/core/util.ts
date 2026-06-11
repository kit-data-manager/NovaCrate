import fileDownload from "js-file-download"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"

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
