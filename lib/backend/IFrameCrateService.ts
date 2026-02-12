import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"
import { makeCrateServiceFeatureFlags } from "@/lib/utils"
import { opfsFunctions } from "@/lib/opfs-worker/functions"

export class IFrameCrateService extends BrowserBasedCrateService {
    get featureFlags() {
        return makeCrateServiceFeatureFlags({
            fileManagement: false,
            iframeMessaging: true,
            crateSelectionControlledExternally: true
        })
    }

    duplicateCrate(): Promise<string> {
        throw "Not supported by iframe service"
    }

    async getStoredCrateIds(): Promise<string[]> {
        return []
    }

    async createFileEntity(): Promise<boolean> {
        throw "Not supported by iframe service"
    }

    async deleteCrate(): Promise<boolean> {
        throw "Not supported by iframe service"
    }

    async getCrateFileInfo(): Promise<{ type: "directory" | "file"; name: string }> {
        throw "Not supported by iframe service"
    }

    async getCrateFileURL(): Promise<string> {
        throw "Not supported by iframe service"
    }

    async getCrateFilesList(): Promise<string[]> {
        return []
    }

    async createCrateFromMetadataFile(metadataFile: Blob) {
        // Create temporary storage for crate and make sure it is used in worker and in local opfsFunctions
        const tempDir = await this.worker.executeUncached("setupTempCrateStorage") // create and use temp dir in worker
        opfsFunctions.setCrateStorageDir(tempDir) // use temp dir locally
        return super.createCrateFromMetadataFile(metadataFile)
    }
}
