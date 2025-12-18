import { useEntityBrowserSettings } from "@/lib/state/entity-browser-settings"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useEditorState } from "@/lib/state/editor-state"
import { memo, useCallback, useMemo } from "react"
import { Diff, getEntityDisplayName, toArray } from "@/lib/utils"
import { EntityContextMenu } from "@/components/entity/entity-context-menu"
import { Button } from "@/components/ui/button"
import { EntityIcon } from "@/components/entity/entity-icon"

export const EntityBrowserItem = memo(function EntityBrowserItem(props: { entityId: string }) {
    const showEntityType = useEntityBrowserSettings((store) => store.showEntityType)
    const showIdInsteadOfName = useEntityBrowserSettings((store) => store.showIdInsteadOfName)
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const entity = useEditorState((state) => state.entities.get(props.entityId))
    const diff = useEditorState((state) => state.getEntityDiff(props.entityId))

    const hasUnsavedChanges = useMemo(() => {
        return entity ? diff !== Diff.None : false
    }, [diff, entity])

    const openSelf = useCallback(() => {
        if (!entity) return
        openTab(createEntityEditorTab(entity), true)
    }, [openTab, entity])

    if (!entity) {
        console.warn(
            "EntityBrowserItem could not be rendered because the entity does not exist:",
            props.entityId
        )
        return null
    }

    return (
        <EntityContextMenu entity={entity} asChild>
            <Button
                size="sm"
                variant="list-entry"
                className="group/entityBrowserItem shrink-0"
                onClick={openSelf}
            >
                <EntityIcon entity={entity} unsavedChanges={hasUnsavedChanges} />
                <div className="truncate">
                    <span className="group-hover/entityBrowserItem:underline underline-offset-2">
                        {showIdInsteadOfName ? props.entityId : getEntityDisplayName(entity)}
                    </span>
                    {showEntityType ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                            {toArray(entity["@type"]).join(", ")}
                        </span>
                    ) : null}
                </div>
            </Button>
        </EntityContextMenu>
    )
})
