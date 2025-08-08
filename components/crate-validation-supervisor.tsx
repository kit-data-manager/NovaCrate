import { useCallback, useContext, useEffect, useMemo } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useValidation, useValidationStore } from "@/lib/validation/hooks"
import { useDebounceCallback } from "usehooks-ts"
import { useEditorState } from "@/lib/state/editor-state"
import { useStore } from "zustand/index"

/**
 * Hooks into the editor state and the crate data context to watch for changes in the crate, each entity, and each property. It then starts the validation of any changed
 * thing after not observing changes on the same thing for some time.
 *
 * While the user is writing in some input, the thing becomes changed. After the user stopped writing, some time passes,
 * and the validation is run.
 *
 * Does not render anything.
 * @constructor
 */
export function CrateValidationSupervisor() {
    const { crateData } = useContext(CrateDataContext)
    const entities = useEditorState((store) => store.entities)
    const validation = useValidation()

    const validateCrate = useCallback(() => {
        validation.validateCrate().catch((e) => console.error("Crate validation failed: ", e))
    }, [validation])

    const debouncedValidateCrate = useDebounceCallback(validateCrate, 200)

    useEffect(() => {
        debouncedValidateCrate()
    }, [crateData, debouncedValidateCrate])

    const entitiesArray = useMemo(() => {
        return Array.from(entities.values())
    }, [entities])

    return (
        <>
            {entitiesArray.map((entity) => (
                <EntitySupervisor key={entity["@id"]} entity={entity} />
            ))}
        </>
    )
}

function EntitySupervisor({ entity }: { entity: IEntity }) {
    const validation = useValidation()
    const validationStore = useValidationStore()
    const clearResults = useStore(validationStore, (s) => s.clearResults)

    const entityId = useMemo(() => {
        return entity["@id"]
    }, [entity])

    const runValidation = useCallback(() => {
        validation
            .validateEntity(entityId)
            .catch((e) => console.error(`Entity validation (${entityId}) failed: `, e))
    }, [entityId, validation])

    const debouncedRunValidation = useDebounceCallback(runValidation, 600)

    useEffect(() => {
        debouncedRunValidation()
    }, [debouncedRunValidation, entity])

    const unmount = useCallback(() => {
        clearResults(entityId)
    }, [clearResults, entityId])

    useEffect(() => {
        // Entity was deleted, remove all results
        return () => unmount()
    }, [unmount])

    const properties = useMemo(() => {
        return Array.from(Object.entries(entity))
    }, [entity])

    return (
        <>
            {properties.map(([name, value]) => (
                <PropertySupervisor entityId={entityId} key={name} name={name} value={value} />
            ))}
        </>
    )
}

function PropertySupervisor({
    name,
    value,
    entityId
}: {
    entityId: string
    value: EntityPropertyTypes
    name: string
}) {
    const validation = useValidation()
    const validationStore = useValidationStore()
    const clearResults = useStore(validationStore, (s) => s.clearResults)

    const runValidation = useCallback(() => {
        validation
            .validateProperty(entityId, name)
            .catch((e) => console.error(`Property validation (${entityId} ${name}) failed: `, e))
    }, [entityId, name, validation])

    const debouncedRunValidation = useDebounceCallback(runValidation, 500)

    useEffect(() => {
        debouncedRunValidation()
    }, [debouncedRunValidation, value])

    const unmount = useCallback(() => {
        // Property was deleted, remove all results
        clearResults(entityId, name)
    }, [clearResults, entityId, name])

    useEffect(() => {
        return () => unmount()
    }, [unmount])

    return null
}
