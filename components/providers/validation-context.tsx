import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef } from "react"
import { ValidationProvider } from "@/lib/validation/validation-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import {
    makeBaseValidator,
    makeSpecificationValidators
} from "@/lib/validation/validators/specification-validator"
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

        const specValidators = makeSpecificationValidators()
        for (const validator of specValidators) {
            validation.current.addValidator(validator)
        }
        validation.current.addValidator(makeBaseValidator())
    }

    useEffect(() => {
        validation.current.updateContext(ctx)
    }, [ctx])

    const value = useMemo(() => {
        return { validation: validation.current }
    }, [])

    return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>
}
