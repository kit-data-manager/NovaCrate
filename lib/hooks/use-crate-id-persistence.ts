import { useEffect } from "react"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { useRouter } from "next/navigation"
import { useGoToMainMenu } from "@/lib/hooks/hooks"

const CRATE_ID_STORAGE_KEY = "crate-id"

/**
 * Bridges {@link IPersistenceService} and `localStorage` for crate ID
 * persistence across page reloads.
 *
 * **On mount**: If `persistence.canSetCrateId()` is `true`, reads the stored
 * crate ID from `localStorage` and calls `persistence.setCrateId(savedId)`.
 *
 * **On `"crate-id-changed"` events**: Writes the new crate ID to
 * `localStorage`, or removes it when the crate is closed (`null`).
 *
 * This hook should only be mounted inside the editor routes
 * (`/editor/full/*`), not on the landing page — otherwise navigating to the
 * main menu would auto-reopen the last crate.
 */
export function useCrateIdPersistence(persistence: IPersistenceService): void {
    const router = useRouter()
    const goToMainMenu = useGoToMainMenu()

    useEffect(() => {
        // Restore crate ID from localStorage on mount
        if (persistence.getCrateId() === null && persistence.canSetCrateId()) {
            const saved = localStorage.getItem(CRATE_ID_STORAGE_KEY)
            if (saved) {
                persistence.setCrateId(saved)
            } else {
                // There is no crate ID set and no crate ID stored, we should return the user to the main menu
                goToMainMenu()
            }
        } else if (persistence.getCrateId() !== null) {
            localStorage.setItem(CRATE_ID_STORAGE_KEY, persistence.getCrateId()!)
        }

        // Persist crate ID changes to localStorage
        const removeListener = persistence.events.addEventListener(
            "crate-id-changed",
            (newId: string | null) => {
                if (newId !== null) {
                    localStorage.setItem(CRATE_ID_STORAGE_KEY, newId)
                } else {
                    localStorage.removeItem(CRATE_ID_STORAGE_KEY)
                }
            }
        )

        return () => removeListener()
    }, [goToMainMenu, persistence, router])
}
