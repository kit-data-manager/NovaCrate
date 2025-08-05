import { createContext } from "react"
import { ValidationProvider } from "@/lib/validation/validation-provider"

export interface ValidationContext {
    validation: ValidationProvider | undefined
}

export const ValidationContext = createContext<ValidationContext>({ validation: undefined })
