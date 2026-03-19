"use client"

import { PropsWithChildren } from "react"
import { PersistenceProvider } from "@/components/providers/persistence-provider"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"

const serviceProvider = new BrowserBasedCrateService()

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <PersistenceProvider>
            <CrateDataProvider serviceProvider={serviceProvider}>
                <GlobalModalProvider>{props.children}</GlobalModalProvider>
            </CrateDataProvider>
        </PersistenceProvider>
    )
}
