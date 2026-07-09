import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { usePersistence } from "@/components/providers/persistence-provider"
import { useValidation, useValidationStore } from "@/lib/validation/hooks"
import { useDebounceCallback } from "usehooks-ts"
import { useEditorState } from "@/lib/state/editor-state"
import { useStore } from "zustand"
import { validationSettings } from "@/lib/state/validation-settings"
import { useCore } from "@/components/providers/core-provider"

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
    const persistence = usePersistence()
    const crateId = persistence.getCrateId()
    const entities = useEditorState((store) => store.entities)
    const crateContextReady = useEditorState((store) => store.crateContextReady)
    const validation = useValidation()
    const [runValidation, setRunValidation] = useState(false)
    const validationEnabled = useStore(validationSettings, (s) => s.enabled)
    const core = useCore()
    const metadata = core.getMetadataService()
    const context = core.getContextService()
    const profiles = core.getProfileService()

    const validateCrate = useCallback(() => {
        validation.validateCrate().catch((e) => console.error("Crate validation failed: ", e))
    }, [validation])

    // Validates the crate once upon editor mount
    // The same happens for entities and properties in the EntitySupervisor and PropertySupervisor components
    useEffect(() => {
        if (runValidation) validateCrate()
    }, [runValidation, validateCrate])

    const validateAll = useCallback(async () => {
        const entities = metadata.getEntities()
        validateCrate()
        entities.forEach((entity) => {
            validation
                .validateEntity(entity["@id"])
                .catch((e) => console.error(`Entity validation failed on ${entity["@id"]}: `, e))
            Object.keys(entity).forEach((prop) => {
                validation
                    .validateProperty(entity["@id"], prop)
                    .catch((e) =>
                        console.error(`Property validation failed on ${entity["@id"]} ${prop}: `, e)
                    )
            })
        })
    }, [metadata, validateCrate, validation])

    const debouncedValidateAll = useDebounceCallback(validateAll, 200, { maxWait: 500 })

    // Validate everything when graph-changed or context-changed events fire (typically on save)
    useEffect(() => {
        if (!runValidation) return

        const removeListener1 = metadata.events.addEventListener(
            "graph-changed",
            debouncedValidateAll
        )
        const removeListener2 = context.events.addEventListener(
            "context-changed",
            debouncedValidateAll
        )
        const removeListener3 = profiles.events.addEventListener("all-ready-changed", (r) => {
            if (r) debouncedValidateAll()
        })
        return () => {
            removeListener1()
            removeListener2()
            removeListener3()
        }
    }, [
        context.events,
        debouncedValidateAll,
        metadata.events,
        profiles.events,
        runValidation,
        validationEnabled
    ])

    // Automatically turn runValidation on and off
    useEffect(() => {
        if (crateId && crateContextReady && validationEnabled) setRunValidation(true)
        else setRunValidation(false)
    }, [crateContextReady, crateId, validationEnabled])

    // Clear the validation store results when the validation is turned off in the settings
    useEffect(() => {
        if (!validationEnabled) {
            validation.resultStore.getState().clearAll()
        }
    }, [validation.resultStore, validationEnabled])

    const entitiesArray = useMemo(() => {
        return Array.from(entities.values())
    }, [entities])

    if (!crateId || !runValidation) return null

    // EntitySupervisor and PropertySupervisor hook into the live editor state for faster validation of entities and properties while editing
    return (
        <>
            {entitiesArray.map((entity) => (
                <EntitySupervisor key={entity["@id"]} entity={entity} />
            ))}
        </>
    )
}

const EntitySupervisor = memo(function EntitySupervisor({ entity }: { entity: IEntity }) {
    const validation = useValidation()
    const validationStore = useValidationStore()
    const clearByEntityIdOrPropertyName = useStore(
        validationStore,
        (s) => s.clearByEntityIdOrPropertyName
    )

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
        debouncedRunValidation.cancel()
        clearByEntityIdOrPropertyName(entityId)
    }, [clearByEntityIdOrPropertyName, debouncedRunValidation, entityId])

    useEffect(() => {
        // Entity was deleted, remove all validation results of this entity
        return () => unmount()
    }, [debouncedRunValidation, unmount])

    const crateContext = useEditorState((store) => store.crateContext)
    useEffect(() => {
        debouncedRunValidation()
    }, [debouncedRunValidation, crateContext])

    const properties = useMemo(() => {
        return Array.from(Object.entries(entity)).filter(([name]) => name !== "@reverse")
    }, [entity])

    return (
        <>
            {properties.map(([name, value]) => (
                <PropertySupervisor entityId={entityId} key={name} name={name} value={value} />
            ))}
        </>
    )
})

const PropertySupervisor = memo(function PropertySupervisor({
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
    const clearByEntityIdOrPropertyName = useStore(
        validationStore,
        (s) => s.clearByEntityIdOrPropertyName
    )

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
        debouncedRunValidation.cancel()
        clearByEntityIdOrPropertyName(entityId, name)
    }, [clearByEntityIdOrPropertyName, debouncedRunValidation, entityId, name])

    const crateContext = useEditorState((store) => store.crateContext)
    useEffect(() => {
        debouncedRunValidation()
    }, [debouncedRunValidation, crateContext])

    useEffect(() => {
        return () => unmount()
    }, [unmount])

    return null
})
