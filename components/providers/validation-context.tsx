import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"
import { ValidationProvider } from "@/lib/validation/validation-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import {
    makeBaseValidator,
    makeSpecificationValidators
} from "@/lib/validation/validators/specification-validator"
import { usePersistence } from "@/components/providers/persistence-provider"

export interface ValidationContext {
    validation: ValidationProvider | undefined
}

export const ValidationContext = createContext<ValidationContext>({ validation: undefined })

export function ValidationContextProvider({ children }: PropsWithChildren) {
    const schemaWorker = useContext(SchemaWorker)
    const persistence = usePersistence()
    const editorState = useEditorState((s) => s)

    const fileService = useMemo(() => {
        return persistence.getCrateService()?.getFileService()
    }, [persistence])

    const ctx = useMemo(() => {
        return {
            editorState,
            schemaWorker,
            fileService: fileService ?? undefined
        }
    }, [editorState, fileService, schemaWorker])

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
