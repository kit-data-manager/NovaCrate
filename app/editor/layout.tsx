"use client"

import { PropsWithChildren, useState } from "react"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"
import { useParams } from "next/navigation"
import { IFrameCrateService } from "@/lib/backend/IFrameCrateService"

export default function EditorLayout(props: PropsWithChildren) {
    const { mode } = useParams<{ mode: string }>()

    const [serviceProvider] = useState(() => {
        if (mode === "iframe") return new IFrameCrateService()
        else return new BrowserBasedCrateService()
    })

    return (
        <CrateDataProvider serviceProvider={serviceProvider}>
            <GlobalModalProvider>{props.children}</GlobalModalProvider>
        </CrateDataProvider>
    )
}
