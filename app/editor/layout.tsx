"use client"

import { PropsWithChildren, useRef } from "react"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"
import { ValidationContext, ValidationProvider } from "@/lib/validation/ValidationProvider"
import { SampleValidator } from "@/lib/validation/SampleValidator"
import { editorState } from "@/lib/state/editor-state"

const serviceProvider = new BrowserBasedCrateService()

export default function EditorLayout(props: PropsWithChildren) {
    const validation = useRef<ValidationProvider>(null!)
    if (!validation.current) {
        validation.current = new ValidationProvider(editorState)
        validation.current.addValidator(new SampleValidator())
    }

    return (
        <CrateDataProvider serviceProvider={serviceProvider}>
            <GlobalModalProvider>
                <ValidationContext.Provider value={{ validation: validation.current }}>
                    {props.children}
                </ValidationContext.Provider>
            </GlobalModalProvider>
        </CrateDataProvider>
    )
}
