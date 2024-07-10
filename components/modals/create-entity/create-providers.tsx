import { PersonImport } from "@/components/modals/create-entity/person-import"
import React, { useMemo, useState } from "react"
import { AutoReference } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { SCHEMA_ORG_ORGANIZATION, SCHEMA_ORG_PERSON } from "@/lib/constants"
import { OrganizationImport } from "@/components/modals/create-entity/organization-import"

export function CreateProviders({
    selectedType,
    backToTypeSelect,
    onProviderCreate,
    autoReference,
    fallback
}: {
    selectedType: string
    backToTypeSelect: () => void
    onProviderCreate: (entity: IEntity | string) => void
    autoReference?: AutoReference
    fallback: React.ReactNode
}) {
    const context = useEditorState.useCrateContext()
    const [manualCreation, setManualCreation] = useState(true)

    const canUsePersonProvider = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_PERSON
    }, [context, selectedType])

    const canUseOrganizationProvider = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_ORGANIZATION
    }, [context, selectedType])

    const provider = useMemo(() => {
        if (canUsePersonProvider) {
            return (
                <PersonImport
                    createManually={manualCreation}
                    setCreateManually={setManualCreation}
                    backToTypeSelect={backToTypeSelect}
                    onProviderCreate={onProviderCreate}
                    autoReference={autoReference}
                />
            )
        } else if (canUseOrganizationProvider) {
            return (
                <OrganizationImport
                    createManually={manualCreation}
                    setCreateManually={setManualCreation}
                    backToTypeSelect={backToTypeSelect}
                    onProviderCreate={onProviderCreate}
                    autoReference={autoReference}
                />
            )
        } else return null
    }, [
        autoReference,
        backToTypeSelect,
        canUseOrganizationProvider,
        canUsePersonProvider,
        manualCreation,
        onProviderCreate
    ])

    const hasProvider = useMemo(() => {
        return canUsePersonProvider || canUseOrganizationProvider
    }, [canUseOrganizationProvider, canUsePersonProvider])

    return (
        <>
            {provider}

            {!hasProvider || manualCreation ? fallback : null}
        </>
    )
}
