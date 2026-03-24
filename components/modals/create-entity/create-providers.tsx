import { PersonImport } from "@/components/modals/create-entity/person-import"
import React, { useMemo, useState } from "react"
import { useContextResolver } from "@/lib/hooks"
import { SCHEMA_ORG_ORGANIZATION, SCHEMA_ORG_PERSON } from "@/lib/constants"
import { OrganizationImport } from "@/components/modals/create-entity/organization-import"
import { AutoReference } from "@/lib/utils"

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
    const resolver = useContextResolver()
    const [manualCreation, setManualCreation] = useState(true)

    const canUsePersonProvider = useMemo(() => {
        return resolver.resolve(selectedType) === SCHEMA_ORG_PERSON
    }, [resolver, selectedType])

    const canUseOrganizationProvider = useMemo(() => {
        return resolver.resolve(selectedType) === SCHEMA_ORG_ORGANIZATION
    }, [resolver, selectedType])

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
