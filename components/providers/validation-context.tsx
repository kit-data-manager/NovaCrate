import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"
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

    const [validation] = useState(() => {
        const validation = new ValidationProvider(ctx)
        const specValidators = makeSpecificationValidators()
        for (const validator of specValidators) {
            validation.addValidator(validator)
        }
        validation.addValidator(makeBaseValidator())
        return validation
    })

    useEffect(() => {
        validation.updateContext(ctx)
    }, [ctx, validation])

    const value = useMemo(() => {
        return { validation: validation }
    }, [validation])

    return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>
}
