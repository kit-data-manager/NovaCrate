"use client"

import { PropsWithChildren } from "react"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"
import { GlobalSettingsProvider } from "@/components/providers/global-settings-provider"

const serviceProvider = new BrowserBasedCrateService()

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <GlobalSettingsProvider>
            <CrateDataProvider serviceProvider={serviceProvider}>
                <GlobalModalProvider>{props.children}</GlobalModalProvider>
            </CrateDataProvider>
        </GlobalSettingsProvider>
    )
}
