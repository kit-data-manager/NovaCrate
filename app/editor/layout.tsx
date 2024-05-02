"use client"

import { PropsWithChildren } from "react"
import { CrateDataProvider } from "@/components/crate-data-provider"
import { Nav } from "@/components/nav"
import { RestProvider } from "@/lib/rest-provider"
import { usePathname } from "next/navigation"
import { EntityEditorTabsProvider } from "@/components/entity-tabs-provider"
import { CrateVerifyProvider } from "@/components/crate-verify-provider"
import { GlobalModalProvider } from "@/components/global-modals-provider"

const serviceProvider = new RestProvider()

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <CrateDataProvider serviceProvider={serviceProvider}>
            <GlobalModalProvider>{props.children}</GlobalModalProvider>
        </CrateDataProvider>
    )
}
