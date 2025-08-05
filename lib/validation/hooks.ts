import { useContext } from "react"
import { ValidationContext } from "@/components/providers/validation-context"

export function useValidation() {
    const val = useContext(ValidationContext).validation
    if (!val) throw "ValidationContext is not mounted"
    return val
}

export function useValidationStore() {
    const store = useContext(ValidationContext).validation?.resultStore
    if (!store) throw "ValidationContext is not mounted"
    return store
}
