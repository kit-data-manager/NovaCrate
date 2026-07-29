import React, { useMemo, useState } from "react"
import { Import, TextCursor } from "lucide-react"
import { useContextResolver } from "@/lib/hooks/hooks"
import { SCHEMA_ORG_ORGANIZATION, SCHEMA_ORG_PERSON } from "@/lib/constants"
import { AutoReference, toArray } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EntityImport } from "@/components/modals/create-entity/components/entity-import"
import { importOrganizationFromRor, importPersonFromOrcid } from "@/lib/entity-import"

/**
 * Configuration for a single import provider. The parent {@link CreateProviders}
 * selects at most one matching provider based on the resolved entity type and
 * renders a manual/provider tab switch when one is present. When no provider
 * matches, the tabs are hidden and only the manual fallback is shown.
 */
type ProviderConfig = {
    tabLabel: string
    node: React.ReactNode
}

export function CreateProviders({
    selectedType,
    backToTypeSelect,
    onProviderCreate,
    autoReference,
    fallback
}: {
    selectedType: string | string[]
    backToTypeSelect: () => void
    onProviderCreate: (entity: IEntity | string) => void
    autoReference?: AutoReference
    fallback: React.ReactNode
}) {
    const resolver = useContextResolver()
    const [manualCreation, setManualCreation] = useState(true)

    const canUsePersonProvider = useMemo(() => {
        return toArray(selectedType).some((type) => resolver.resolve(type) === SCHEMA_ORG_PERSON)
    }, [resolver, selectedType])

    const canUseOrganizationProvider = useMemo(() => {
        return toArray(selectedType).some(
            (type) => resolver.resolve(type) === SCHEMA_ORG_ORGANIZATION
        )
    }, [resolver, selectedType])

    const provider = useMemo<ProviderConfig | null>(() => {
        if (canUsePersonProvider) {
            return {
                tabLabel: "Import from ORCID",
                node: (
                    <EntityImport
                        importFn={importPersonFromOrcid}
                        title="Import Person from ORCID"
                        searchUrl="https://orcid.org/orcid-search/search"
                        searchLabel="ORCID.org"
                        inputLabel="ORCID URL or Identifier"
                        placeholder="https://orcid.org/..."
                        descriptionSuffix="ORCID ID or URL"
                        backToTypeSelect={backToTypeSelect}
                        onProviderCreate={onProviderCreate}
                        autoReference={autoReference}
                    />
                )
            }
        } else if (canUseOrganizationProvider) {
            return {
                tabLabel: "Import from ROR",
                node: (
                    <EntityImport
                        importFn={importOrganizationFromRor}
                        title="Import Organization from ROR"
                        searchUrl="https://ror.org/search"
                        searchLabel="ROR.org"
                        inputLabel="ROR URL or Identifier"
                        placeholder="https://ror.org/..."
                        descriptionSuffix="ROR ID or URL"
                        backToTypeSelect={backToTypeSelect}
                        onProviderCreate={onProviderCreate}
                        autoReference={autoReference}
                    />
                )
            }
        } else return null
    }, [
        autoReference,
        backToTypeSelect,
        canUseOrganizationProvider,
        canUsePersonProvider,
        onProviderCreate
    ])

    if (!provider) return <>{fallback}</>

    return (
        <>
            <Tabs
                className="mb-4"
                value={manualCreation ? "manual" : "import"}
                onValueChange={(v) => setManualCreation(v === "manual")}
            >
                <TabsList className="flex self-center">
                    <TabsTrigger value="manual">
                        <TextCursor className="size-4 mr-2" /> Create Manually
                    </TabsTrigger>
                    <TabsTrigger value="import">
                        <Import className="size-4 mr-2" /> {provider.tabLabel}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {manualCreation ? fallback : provider.node}
        </>
    )
}
