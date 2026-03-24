"use client"

import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react"
import { ICoreService } from "@/lib/core/ICoreService"
import { PersistenceAdapterImpl } from "@/lib/core/impl/PersistenceAdapterImpl"
import { CoreServiceImpl } from "@/lib/core/impl/CoreServiceImpl"
import { usePersistence } from "@/components/providers/persistence-provider"
import { useCoreSync } from "@/lib/hooks/use-core-sync"
import { useRouter } from "next/navigation"
import { useCrateIdPersistence } from "@/lib/hooks/use-crate-id-persistence"
import { LoadingHero } from "@/components/loading-hero"

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
    const router = useRouter()

    useCrateIdPersistence(persistence)

    const [core, setCore] = useState<ICoreService | null>(null)

    const adapterRef = useRef<PersistenceAdapterImpl | null>(null)
    const coreRef = useRef<CoreServiceImpl | null>(null)

    useEffect(() => {
        let cancelled = false

        function disposeCurrent() {
            coreRef.current?.dispose()
            coreRef.current = null
            adapterRef.current?.dispose()
            adapterRef.current = null
        }

        async function initCore() {
            const crateService = persistence.getCrateService()

            if (!crateService) {
                return
            }

            disposeCurrent()

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

        const remove = persistence.events.addEventListener("crate-service-changed", () => {
            initCore()
        })

        initCore()

        return () => {
            cancelled = true
            remove()
            disposeCurrent()
        }
    }, [persistence, router])

    useCoreSync(core)

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
