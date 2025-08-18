import { useStoreWithEqualityFn } from "zustand/traditional"
import { editorState } from "@/lib/state/editor-state"
import {
    getEntityDisplayName,
    isContextualEntity,
    isDataEntity,
    isRoCrateMetadataEntity
} from "@/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { EntityBrowserItem } from "@/components/entity-browser/entity-browser-item"

export type DefaultSectionOpen = boolean | "indeterminate"

export function EntityBrowserSection(props: {
    section: "Data" | "Contextual"
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const entities = useStoreWithEqualityFn(
        editorState,
        (store) => {
            return Array.from(store.entities.entries())
                .map(([key, item]) => [key, item] as [string, IEntity])
                .filter(
                    ([, item]) =>
                        item["@id"] !== store.getRootEntityId() && !isRoCrateMetadataEntity(item)
                )
                .filter(([, item]) =>
                    props.section === "Data" ? isDataEntity(item) : isContextualEntity(item)
                )
                .sort((a, b) =>
                    getEntityDisplayName(a[1]).localeCompare(getEntityDisplayName(b[1]))
                )
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
                <div className="truncate mr-2">{props.section} Entities</div>
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
