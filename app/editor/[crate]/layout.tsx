"use client"

import { PropsWithChildren } from "react"
import { CrateDataProvider } from "@/components/crate-data-provider"
import { Nav } from "@/components/nav"
import { RestProvider } from "@/lib/rest-provider"
import { usePathname } from "next/navigation"
import { EntityEditorTabsProvider } from "@/components/entity-tabs-provider"
import { CrateVerifyProvider } from "@/components/crate-verify-provider"
import { GlobalModalProvider } from "@/components/global-modals-provider"

const CRATE_ID_REGEX = /^\/editor\/([^\/]*)\/.*$/

const serviceProvider = new RestProvider()

function getCrateId(pathname: string) {
    const matches = CRATE_ID_REGEX.exec(pathname)
    if (matches && matches.length > 1) {
        return matches[1]
    } else return undefined
}

export default function EditorLayout(props: PropsWithChildren) {
    const pathname = usePathname()

    return (
        <CrateDataProvider serviceProvider={serviceProvider} crateId={getCrateId(pathname)}>
            <CrateVerifyProvider>
                <EntityEditorTabsProvider>
                    <GlobalModalProvider>
                        <Nav>{props.children}</Nav>
                    </GlobalModalProvider>
                </EntityEditorTabsProvider>
            </CrateVerifyProvider>
        </CrateDataProvider>
    )
}
