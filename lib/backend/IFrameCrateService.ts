import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"
import { makeCrateServiceFeatureFlags } from "@/lib/utils"

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

    async downloadFile(): Promise<void> {
        return
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
}
