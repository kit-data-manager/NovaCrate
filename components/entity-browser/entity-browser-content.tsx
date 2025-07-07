import {
    DefaultSectionOpen,
    EntityBrowserSection
} from "@/components/entity-browser/entity-browser-section"
import { useContext } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityBrowserItem } from "@/components/entity-browser/entity-browser-item"

export function EntityBrowserContent({
    defaultSectionOpen,
    onSectionOpenChange
}: {
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const crate = useContext(CrateDataContext)

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
            <EntityBrowserItem entityId={"./"} />
            <EntityBrowserSection
                section={"Data"}
                defaultSectionOpen={defaultSectionOpen}
                onSectionOpenChange={onSectionOpenChange}
            />
            <EntityBrowserSection
                section={"Contextual"}
                defaultSectionOpen={defaultSectionOpen}
                onSectionOpenChange={onSectionOpenChange}
            />
        </div>
    )
}
