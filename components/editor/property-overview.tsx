import { useCurrentEntity } from "@/lib/hooks"
import { useCallback, useContext, useMemo } from "react"
import { sortByPropertyName } from "@/components/editor/property-editor"
import {
    Asterisk,
    AtSign,
    Circle,
    Component,
    Dot,
    LayoutGrid,
    Minus,
    PackageSearch,
    SearchIcon,
    XIcon
} from "lucide-react"
import { camelCaseReadable } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EntityEditorTabsContext } from "@/components/providers/entity-tabs-provider"
import { useEntityBrowserState } from "@/lib/state/entity-browser-state"

export function PropertyOverview() {
    const currentEntity = useCurrentEntity()
    const { focusProperty } = useContext(EntityEditorTabsContext)
    const setShowPropertyOverview = useEntityBrowserState((store) => store.setShowPropertyOverview)

    const properties = useMemo(() => {
        if (!currentEntity) return []
        return Object.keys(currentEntity).sort((a, b) => sortByPropertyName(a, b))
    }, [currentEntity])

    const getKey = useCallback(
        (propertyName: string) => {
            if (!currentEntity) return ""
            else return currentEntity["@id"] + "|" + propertyName
        },
        [currentEntity]
    )

    const onEntryClick = useCallback(
        (propertyName: string) => {
            if (!currentEntity) return
            focusProperty(currentEntity["@id"], propertyName)
        },
        [currentEntity, focusProperty]
    )

    return (
        <div className="h-full w-full flex flex-col">
            <div className="pl-4 bg-accent text-sm h-10 flex items-center shrink-0">
                <LayoutGrid className="w-4 h-4 shrink-0 mr-2" /> Property Overview
                <div className="grow" />
                <Button variant="header" size="sm">
                    <SearchIcon className="w-4 h-4" />
                </Button>
                <Button variant="header" size="sm" onClick={() => setShowPropertyOverview(false)}>
                    <XIcon className="w-4 h-4" />
                </Button>
            </div>
            <div className="p-2 overflow-y-auto">
                {properties.map((propertyName) => (
                    <Button
                        key={getKey(propertyName)}
                        className="flex w-full justify-start group/overviewItem shrink-0"
                        variant="list-entry"
                        size="sm"
                        onClick={() => onEntryClick(propertyName)}
                    >
                        {propertyName[0] === "@" ? (
                            <AtSign className="w-4 h-4 mr-2" />
                        ) : (
                            <Minus className="w-4 h-4 mr-2" />
                        )}
                        <div className="group-hover/overviewItem:underline underline-offset-2">
                            {camelCaseReadable(propertyName)}
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    )
}
