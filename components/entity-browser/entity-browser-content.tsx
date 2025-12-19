import {
    DefaultSectionOpen,
    EntityBrowserSection
} from "@/components/entity-browser/entity-browser-section"
import { useContext, useMemo } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useEntityBrowserSettings } from "@/lib/state/entity-browser-settings"
import { isDataEntity, toArray } from "@/lib/utils"
import { GithubDiscontinuationWarning } from "@/components/github-discontinuation-warning"
import { useEditorState } from "@/lib/state/editor-state"

export function EntityBrowserContent({
    defaultSectionOpen,
    onSectionOpenChange
}: {
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const crate = useContext(CrateDataContext)
    const structureBy = useEntityBrowserSettings((s) => s.structureBy)
    const entities = useEditorState((s) => s.entities)
    const rootEntityId = useEditorState((s) => s.getRootEntityId())

    const structure = useMemo(() => {
        const result = new Map<string, Set<string>>()
        if (structureBy === "none") {
            result.set("", new Set(entities.keys()))
        } else if (structureBy === "general-type") {
            if (rootEntityId) result.set("", new Set([rootEntityId]))
            result.set(
                "Data Entities",
                new Set(
                    [...entities.entries()]
                        .filter(
                            ([, entity]) => isDataEntity(entity) && entity["@id"] !== rootEntityId
                        )
                        .map(([id]) => id)
                )
            )
            result.set(
                "Contextual Entities",
                new Set(
                    [...entities.entries()]
                        .filter(([, entity]) => !isDataEntity(entity))
                        .map(([id]) => id)
                )
            )
        } else if (structureBy === "@type") {
            for (const value of entities.values()) {
                for (const type of toArray(value["@type"])) {
                    if (result.has(type)) {
                        result.get(type)!.add(value["@id"])
                    } else {
                        result.set(type, new Set([value["@id"]]))
                    }
                }
            }
        } else {
            throw new Error("Unknown structureBy " + structureBy)
        }

        return [...result.entries()].sort()
    }, [entities, rootEntityId, structureBy])

    if (!crate.crateData)
        return (
            <div className="flex flex-col gap-2 p-2">
                <Skeleton className="h-6 w-60" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60 ml-6" />
            </div>
        )

    return (
        <div id="entity-browser-content" className="flex flex-col p-2 overflow-y-auto">
            <GithubDiscontinuationWarning />
            {structure.map(([sectionTitle, entities]) => (
                <EntityBrowserSection
                    key={sectionTitle}
                    entities={entities}
                    defaultSectionOpen={defaultSectionOpen}
                    onSectionOpenChange={onSectionOpenChange}
                    sectionTitle={sectionTitle}
                />
            ))}
        </div>
    )
}
