import { useStoreWithEqualityFn } from "zustand/traditional"
import { editorState } from "@/lib/state/editor-state"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { EntityBrowserItem } from "@/components/entity-browser/entity-browser-item"
import { useEntityBrowserSettings } from "@/lib/state/entity-browser-settings"
import { getEntityDisplayName, toArray } from "@/lib/utils"

export type DefaultSectionOpen = boolean | "indeterminate"

export function EntityBrowserSection(props: {
    entities: Set<string>
    sectionTitle?: string
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const sortBy = useEntityBrowserSettings((store) => store.sortBy)
    const entities = useStoreWithEqualityFn(
        editorState,
        (store) => {
            return Array.from(store.entities.entries())
                .map(([key, item]) => [key, item] as [string, IEntity])
                .filter(([id]) => props.entities.has(id))
                .sort((a, b) => {
                    if (sortBy === "id") return a[1]["@id"].localeCompare(b[1]["@id"])
                    else if (sortBy === "type")
                        return toArray(a[1]["@type"])
                            .sort()
                            .join(", ")
                            .localeCompare(toArray(b[1]["@type"]).sort().join(", "))
                    else return getEntityDisplayName(a[1]).localeCompare(getEntityDisplayName(b[1]))
                })
        },
        (a, b) => {
            if (a.length !== b.length) return false
            for (let i = 0; i < a.length; i++) {
                if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false
            }
            return true
        }
    )

    const [open, setOpen] = useState(
        props.defaultSectionOpen !== "indeterminate" ? props.defaultSectionOpen : true
    )

    useEffect(() => {
        if (props.defaultSectionOpen !== "indeterminate") setOpen(props.defaultSectionOpen)
    }, [props.defaultSectionOpen])

    const toggle = useCallback(() => {
        setOpen(!open)
        props.onSectionOpenChange()
    }, [open, props])

    if (!props.sectionTitle)
        return (
            <div className="shrink-0 flex flex-col">
                {entities.map(([key]) => {
                    return <EntityBrowserItem entityId={key} key={key} />
                })}
            </div>
        )

    return (
        <div className="shrink-0">
            <Button
                size="sm"
                variant="list-entry"
                className="hover:underline underline-offset-2 w-full"
                onClick={toggle}
            >
                <ChevronDown
                    className="w-5 h-5 mr-2 aria-disabled:-rotate-90 shrink-0"
                    aria-disabled={!open}
                />
                <div className="truncate mr-2">
                    {props.sectionTitle} ({entities.length})
                </div>
            </Button>
            {open ? (
                <div className="flex flex-col pl-4">
                    {entities.map(([key]) => {
                        return <EntityBrowserItem entityId={key} key={key} />
                    })}
                </div>
            ) : null}
        </div>
    )
}
