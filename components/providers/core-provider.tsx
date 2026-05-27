"use client"

import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react"
import { ICoreService } from "@/lib/core/ICoreService"
import { PersistenceAdapterImpl } from "@/lib/core/impl/PersistenceAdapterImpl"
import { CoreServiceImpl } from "@/lib/core/impl/CoreServiceImpl"
import { usePersistence } from "@/components/providers/persistence-provider"
import { useCoreSync } from "@/lib/hooks/use-core-sync"
import { useCrateIdPersistence } from "@/lib/hooks/use-crate-id-persistence"
import { LoadingHero } from "@/components/loading-hero"
import { toast } from "sonner"
import { useGoToMainMenu } from "@/lib/hooks/hooks"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useGraphState } from "@/lib/state/graph-state"

const CoreContext = createContext<ICoreService | null>(null)

/**
 * Creates and provides a non-null {@link ICoreService} for the currently open
 * crate.
 *
 * Must be mounted inside a {@link PersistenceProvider} and only on pages where
 * a crate is expected to be open (e.g. `app/editor/full/layout.tsx`).
 *
 * If the crate is deselected while this provider is mounted, it navigates to
 * the main menu and disposes the core service.
 */
export function CoreProvider({ children }: PropsWithChildren) {
    const persistence = usePersistence()

    useCrateIdPersistence(persistence)

    const [core, setCore] = useState<ICoreService | null>(null)

    const adapterRef = useRef<PersistenceAdapterImpl | null>(null)
    const coreRef = useRef<CoreServiceImpl | null>(null)

    // Used only in error handling
    const goToMainMenu = useGoToMainMenu()

    useEffect(() => {
        let cancelled = false

        function disposeCurrent() {
            coreRef.current?.dispose()
            coreRef.current = null
            adapterRef.current?.dispose()
            adapterRef.current = null
        }

        async function initCore() {
            disposeCurrent()
            const crateService = persistence.getCrateService()

            if (!crateService) {
                setCore(null)
                return
            }

            const adapter = new PersistenceAdapterImpl(crateService)
            const coreInstance = await CoreServiceImpl.newInstance(adapter, crateService)

            if (cancelled) {
                // Effect was cleaned up while we were awaiting — discard
                coreInstance.dispose()
                adapter.dispose()
                return
            }

            adapterRef.current = adapter
            coreRef.current = coreInstance
            setCore(coreInstance)
        }

        function handleException(error: unknown) {
            console.error("Failed to initialize core", error)
            toast.error(
                "Failed to initialize NovaCrate. Check the browser console for details. Return to the main menu to select a different crate.",
                {
                    duration: Infinity,
                    dismissible: true,
                    action: { label: "Open Main Menu", onClick: goToMainMenu },
                    closeButton: true
                }
            )
        }

        const remove = persistence.events.addEventListener("crate-service-changed", () => {
            initCore().catch(handleException)
        })

        initCore().catch(handleException)

        return () => {
            cancelled = true
            remove()
            disposeCurrent()
        }
    }, [goToMainMenu, persistence])

    useCoreSync(core)

    useEffect(() => {
        // This must be done in a useEffect so it doesn't run on the server
        if (!core) {
            // Reset some editor states for clean crate switching
            useFileExplorerState.setState(useFileExplorerState.getInitialState())
            useEntityEditorTabs.setState(useEntityEditorTabs.getInitialState())
            useGraphState.setState(useGraphState.getInitialState())
        }
    }, [core])

    if (!core) return <LoadingHero />

    return <CoreContext.Provider value={core}>{children}</CoreContext.Provider>
}

/**
 * Guard that only renders its children if the core service is available.
 * @param children
 * @constructor
 */
export function CoreGuard({ children }: PropsWithChildren) {
    const core = useContext(CoreContext)

    if (!core) return null
    else return children
}

/**
 * Returns the core service for the currently open crate.
 *
 * The returned value is always non-null — this hook can only be used inside a
 * {@link CoreProvider}, which guarantees a crate is open.
 */
export function useCore(): ICoreService {
    const ctx = useContext(CoreContext)
    if (!ctx) {
        throw new Error("useCore must be used within a CoreProvider")
    }
    return ctx
}
