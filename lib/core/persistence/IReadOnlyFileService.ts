import { IFileService } from "@/lib/core/persistence/IFileService"

export type IReadOnlyFileService = Pick<IFileService, "getFile" | "getInfo" | "getContentList">
