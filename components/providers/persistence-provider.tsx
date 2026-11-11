"use client"

import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { BrowserPersistenceService } from "@/lib/persistence/browser/BrowserPersistenceService"
import { IFramePersistenceService } from "@/lib/persistence/iframe/IFramePersistenceService"
import { DesktopPersistenceService } from "@/lib/persistence/desktop/impl"
import { useHealthCheck } from "@/lib/hooks/use-health-check"

/**
 * Build-time persistence backend selection, configured via the
 * `PERSISTENCE_BACKEND` environment variable in `next.config.mjs`
 * (`"browser"` for OPFS, `"desktop"` for the native Rust backend of the
 * Tauri app). The bundler aliases `@/lib/persistence/desktop/impl` so that
 * only the selected implementation is included in the bundle.
 */
const isDesktopBackend = process.env.NEXT_PUBLIC_PERSISTENCE_BACKEND === "desktop"

const PersistenceContext = createContext<{
    setService: (name: string) => void
    service: IPersistenceService
} | null>(null)

/**
 * Provides the appropriate {@link IPersistenceService} implementation based on
 * the editor mode.
 *
 * - `"desktop"`: Creates a {@link DesktopPersistenceService} that talks to the
 *   native Rust backend of the Tauri desktop app (`novacrate-desktop`). Only
 *   available (and automatically default) when the app is built with
 *   `PERSISTENCE_BACKEND=desktop`.
 * - `"full"` (default in browser builds): Creates a
 *   {@link BrowserPersistenceService} backed by OPFS via a Web Worker, with
 *   periodic health checks.
 * - `"iframe"`: Creates an {@link IFramePersistenceService} that holds crate
 *   metadata in memory and communicates with the parent page via postMessage.
 *
 * Mount this above the {@link CoreProvider} so that both the landing page and
 * the editor have access to the persistence service.
 */
export function PersistenceProvider({
    defaultMode,
    children
}: PropsWithChildren<{ defaultMode?: string }>) {
    const parentPersistence = useContext(PersistenceContext)
    if (parentPersistence)
        throw new Error(
            "PersistenceProvider should only be present once in the page, but you are trying to mount a PersistenceProvider inside another PersistenceProvider"
        )

    const [mode, setMode] = useState(defaultMode ?? (isDesktopBackend ? "desktop" : "full"))
    const isIframe = useMemo(() => {
        return mode === "iframe"
    }, [mode])

    const persistence = useMemo<IPersistenceService>(() => {
        if (isIframe) return new IFramePersistenceService()
        if (isDesktopBackend) return new DesktopPersistenceService()
        return new BrowserPersistenceService()
    }, [isIframe])

    const prev = useRef(persistence)
    useEffect(() => {
        if (prev.current !== persistence) {
            console.warn("Persistence changed!")
            prev.current.dispose()
        }
        prev.current = persistence
    }, [persistence])

    const value = useMemo(
        () => ({
            setService: setMode,
            service: persistence
        }),
        [persistence]
    )

    return (
        <PersistenceContext.Provider value={value}>
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
    return ctx.service
}

export function useSetPersistence() {
    const ctx = useContext(PersistenceContext)
    if (!ctx) {
        throw new Error("useSetPersistence must be used within a PersistenceProvider")
    }
    return ctx.setService
}
