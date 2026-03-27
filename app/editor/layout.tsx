"use client"

import { PropsWithChildren } from "react"
import { PersistenceProvider } from "@/components/providers/persistence-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <PersistenceProvider>
            <GlobalModalProvider>{props.children}</GlobalModalProvider>
        </PersistenceProvider>
    )
}
