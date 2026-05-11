"use client"

import { createContext, PropsWithChildren, useContext, useState } from "react"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { BrowserPersistenceService } from "@/lib/persistence/browser/BrowserPersistenceService"
import { IFramePersistenceService } from "@/lib/persistence/iframe/IFramePersistenceService"
import { useHealthCheck } from "@/lib/hooks/use-health-check"

const PersistenceContext = createContext<IPersistenceService | null>(null)

/**
 * Provides the appropriate {@link IPersistenceService} implementation based on
 * the editor mode.
 *
 * - `"full"` (default): Creates a {@link BrowserPersistenceService} backed by
 *   OPFS via a Web Worker, with periodic health checks.
 * - `"iframe"`: Creates an {@link IFramePersistenceService} that holds crate
 *   metadata in memory and communicates with the parent page via postMessage.
 *
 * Mount this above the {@link CoreProvider} so that both the landing page and
 * the editor have access to the persistence service.
 */
export function PersistenceProvider({
    mode = "full",
    children
}: PropsWithChildren<{ mode?: string }>) {
    const isIframe = mode === "iframe"

    const [persistence] = useState<IPersistenceService>(() =>
        isIframe ? new IFramePersistenceService() : new BrowserPersistenceService()
    )

    return (
        <PersistenceContext.Provider value={persistence}>
            {!isIframe && <HealthCheckRunner persistence={persistence} />}
            {children}
        </PersistenceContext.Provider>
    )
}

/**
 * Runs the health check polling loop for the browser persistence service.
 * Extracted into its own component so we can conditionally render it without
 * calling hooks conditionally.
 */
function HealthCheckRunner({ persistence }: { persistence: IPersistenceService }) {
    useHealthCheck(persistence)
    return null
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
