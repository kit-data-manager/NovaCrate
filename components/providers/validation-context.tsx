import { createContext, PropsWithChildren, useContext, useRef } from "react"
import { ValidationProvider } from "@/lib/validation/validation-provider"
import { editorState } from "@/lib/state/editor-state"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { makeSpecificationValidator } from "@/lib/validation/validators/specification-validator"

export interface ValidationContext {
    validation: ValidationProvider | undefined
}

export const ValidationContext = createContext<ValidationContext>({ validation: undefined })

export function ValidationContextProvider({ children }: PropsWithChildren) {
    const schemaWorker = useContext(SchemaWorker)
    const validation = useRef<ValidationProvider>(null!)
    if (!validation.current) {
        validation.current = new ValidationProvider({ editorState, schemaWorker })
        validation.current.addValidator(makeSpecificationValidator())
    }

    return (
        <ValidationContext.Provider value={{ validation: validation.current }}>
            {children}
        </ValidationContext.Provider>
    )
}
