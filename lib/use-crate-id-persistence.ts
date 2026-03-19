import { useEffect } from "react"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"

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
    useEffect(() => {
        // Restore crate ID from localStorage on mount
        if (persistence.canSetCrateId()) {
            const saved = localStorage.getItem(CRATE_ID_STORAGE_KEY)
            if (saved) {
                console.log("Setting the crate id to", saved)
                persistence.setCrateId(saved)
            }
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

        return removeListener
    }, [persistence])
}
