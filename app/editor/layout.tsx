"use client"

import { PropsWithChildren } from "react"
import { PersistenceProvider } from "@/components/providers/persistence-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { usePathname } from "next/navigation"

/**
 * Root layout for all `/editor/*` routes.
 *
 * Provides a browser-mode {@link PersistenceProvider} for the landing page
 * (`/editor`) which needs access to the repository service for listing and
 * creating crates.
 *
 * The `/editor/[mode]/` sub-layout mounts its own {@link PersistenceProvider}
 * (selected by the `mode` path segment), which shadows this one for the
 * editor routes.
 */
export default function EditorLayout(props: PropsWithChildren) {
    const path = usePathname()
    const extract = /.*\/editor\/([^\/]+)/gm.exec(path)
    const mode = extract && extract?.length > 1 ? extract[1] : undefined

    return (
        <PersistenceProvider defaultMode={mode}>
            <GlobalModalProvider>{props.children}</GlobalModalProvider>
        </PersistenceProvider>
    )
}
