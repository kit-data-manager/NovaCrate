"use client"

import { PropsWithChildren } from "react"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { BrowserBasedServiceProvider } from "@/lib/backend/BrowserBasedServiceProvider"

const serviceProvider = new BrowserBasedServiceProvider()

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <CrateDataProvider serviceProvider={serviceProvider}>
            <GlobalModalProvider>{props.children}</GlobalModalProvider>
        </CrateDataProvider>
    )
}
