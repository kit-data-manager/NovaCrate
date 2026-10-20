import { StorageInfo } from "@/components/storage-info"
import { Button } from "@/components/ui/button"
import { TrashIcon } from "lucide-react"
import { useCallback } from "react"
import { useRepositoryService } from "@/lib/hooks/use-persistence"
import { useGoToMainMenu, useRecentCrates } from "@/lib/hooks/hooks"

export function StoragePage() {
    const repo = useRepositoryService()
    const { clearRecentCrates } = useRecentCrates()
    const goToMainMenu = useGoToMainMenu()

    const clearLocalStorage = useCallback(() => {
        const confirm = prompt(
            'Are you sure? All your settings will be lost. Enter "I understand" to continue'
        )
        if (confirm === "I understand") {
            localStorage.clear()
            location.reload()
        }
    }, [])

    const deleteAllCrates = useCallback(async () => {
        if (!repo) return
        const confirm = prompt(
            'Are you sure? All your RO-Crates in NovaCrate will be lost. Enter "I understand" to continue'
        )

        if (confirm === "I understand") {
            try {
                await repo.deleteAllCrates()
            } catch (e) {
                console.error("Failed to delete all crates", e)
                alert("Failed to delete all crates.")
            }

            clearRecentCrates()
            goToMainMenu()
            location.reload()
        }
    }, [clearRecentCrates, goToMainMenu, repo])

    return (
        <div>
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Storage</h3>
            <div className="border rounded mb-4">
                <StorageInfo />
            </div>
            <div className="flex flex-col gap-2 items-start">
                <Button variant="destructive" onClick={clearLocalStorage}>
                    <TrashIcon /> Reset all Settings
                </Button>
                <Button variant="destructive" onClick={deleteAllCrates}>
                    <TrashIcon /> Delete all stored RO-Crates
                </Button>
            </div>
        </div>
    )
}
