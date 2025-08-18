import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef } from "react"
import { ValidationProvider } from "@/lib/validation/validation-provider"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { makeSpecificationValidator } from "@/lib/validation/validators/specification-validator"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

export interface ValidationContext {
    validation: ValidationProvider | undefined
}

export const ValidationContext = createContext<ValidationContext>({ validation: undefined })

export function ValidationContextProvider({ children }: PropsWithChildren) {
    const schemaWorker = useContext(SchemaWorker)
    const crateDataProvider = useContext(CrateDataContext)
    const editorState = useEditorState((s) => s)

    const ctx = useMemo(() => {
        return {
            editorState,
            schemaWorker,
            serviceProvider: crateDataProvider.serviceProvider,
            crateData: crateDataProvider
        }
    }, [crateDataProvider, editorState, schemaWorker])

    const validation = useRef<ValidationProvider>(null!)
    if (!validation.current) {
        validation.current = new ValidationProvider(ctx)
        validation.current.addValidator(makeSpecificationValidator())
    }

    useEffect(() => {
        validation.current.updateContext(ctx)
    }, [ctx])

    return (
        <ValidationContext.Provider value={{ validation: validation.current }}>
            {children}
        </ValidationContext.Provider>
    )
}
