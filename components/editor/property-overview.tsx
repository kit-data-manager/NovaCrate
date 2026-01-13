import { useCurrentEntity } from "@/lib/hooks"
import { useCallback, useMemo, useState } from "react"
import { AtSign, LayoutGrid, Minus, SearchIcon, XIcon } from "lucide-react"
import { camelCaseReadable } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useEntityBrowserSettings } from "@/lib/state/entity-browser-settings"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { sortByPropertyName } from "@/lib/property"
import { useEditorState } from "@/lib/state/editor-state"

export function PropertyOverview() {
    const currentEntity = useCurrentEntity()
    const focusProperty = useEntityEditorTabs((store) => store.focusProperty)
    const setShowPropertyOverview = useEntityBrowserSettings(
        (store) => store.setShowPropertyOverview
    )
    const [search, setSearch] = useState("")

    const properties = useMemo(() => {
        if (!currentEntity) return []
        const all = Object.keys(currentEntity)
            .sort((a, b) => sortByPropertyName(a, b))
            .filter((e) => e !== "@reverse")
        if (!search) return all
        else
            return all.filter((property) =>
                property.toLowerCase().includes(search.replaceAll(" ", "").toLowerCase())
            )
    }, [currentEntity, search])

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
        <div className="bg-background h-full w-full flex flex-col overflow-hidden rounded-lg border">
            <div className="pl-4 pr-2 text-sm h-10 flex items-center shrink-0 border-b">
                <LayoutGrid className="size-4 shrink-0 mr-2" /> Property Overview
                <div className="grow" />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="mr-2">
                            <SearchIcon className="size-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="grid grid-cols-1 gap-2">
                        <h4 className="font-medium leading-none">Search for Properties</h4>
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={() => setShowPropertyOverview(false)}>
                    <XIcon className="size-4" />
                </Button>
            </div>
            <div className="p-2 overflow-y-auto">
                {search ? (
                    <div className="text-muted-foreground text-sm pl-2 flex justify-between items-center">
                        <div>Showing search results for &quot;{search}&quot;</div>
                        <Button
                            variant="link"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => setSearch("")}
                        >
                            Clear
                        </Button>
                    </div>
                ) : null}
                {properties.map((propertyName) => (
                    <Button
                        key={getKey(propertyName)}
                        className="flex w-full justify-start group/overviewItem shrink-0"
                        variant="list-entry"
                        size="sm"
                        onClick={() => onEntryClick(propertyName)}
                    >
                        {propertyName[0] === "@" ? (
                            <AtSign className="size-4 mr-2" />
                        ) : (
                            <Minus className="size-4 mr-2" />
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
