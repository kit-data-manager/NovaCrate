import { IReadOnlyFileService } from "@/lib/core/persistence/IReadOnlyFileService"
import { IFileInfo } from "@/lib/core/persistence"

export class NoOpReadOnlyFileService implements IReadOnlyFileService {
    getFile(): Promise<Blob> {
        throw new Error("Tried to call getFile on an empty file service (NoOpReadOnlyFileService)")
    }

    getInfo(): Promise<IFileInfo> {
        throw new Error("Tried to call getInfo on an empty file service (NoOpReadOnlyFileService)")
    }

    async getContentList(): Promise<IFileInfo[]> {
        return []
    }
}
