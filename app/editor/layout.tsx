"use client"

import { PropsWithChildren } from "react"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { RestProvider } from "@/lib/rest-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"

const serviceProvider = new RestProvider()

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <CrateDataProvider serviceProvider={serviceProvider}>
            <GlobalModalProvider>{props.children}</GlobalModalProvider>
        </CrateDataProvider>
    )
}
