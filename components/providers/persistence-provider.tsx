"use client"

import { createContext, PropsWithChildren, useContext, useState } from "react"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { BrowserPersistenceService } from "@/lib/persistence/browser/BrowserPersistenceService"

const PersistenceContext = createContext<IPersistenceService | null>(null)

/**
 * Provides the browser-based {@link IPersistenceService} to the component tree.
 *
 * Mount this high up (e.g. `app/editor/layout.tsx`) so that both the main menu
 * and the editor have access to the persistence service.
 */
export function PersistenceProvider({ children }: PropsWithChildren) {
    const [persistence] = useState(() => new BrowserPersistenceService())

    return <PersistenceContext.Provider value={persistence}>{children}</PersistenceContext.Provider>
}

/**
 * Returns the persistence service. Always available when mounted inside a
 * {@link PersistenceProvider}.
 */
export function usePersistence(): IPersistenceService {
    const ctx = useContext(PersistenceContext)
    if (!ctx) {
        throw new Error("usePersistence must be used within a PersistenceProvider")
    }
    return ctx
}
