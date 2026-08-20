import { useEntityBrowserSettings } from "@/lib/state/entity-browser-settings"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useEditorState } from "@/lib/state/editor-state"
import { memo, useCallback, useMemo } from "react"
import { camelCaseReadable, Diff, getEntityDisplayName, toArray } from "@/lib/utils"
import { EntityContextMenu } from "@/components/entity/entity-context-menu"
import { Button } from "@/components/ui/button"
import { EntityIcon } from "@/components/entity/entity-icon"
import { useActiveEntityRules } from "@/lib/hooks/use-profile-service"

export interface IEntityBrowserItemProps {
    entityId: string
}

export const EntityBrowserItem = memo(function EntityBrowserItem(props: IEntityBrowserItemProps) {
    const showEntityType = useEntityBrowserSettings((store) => store.showEntityType)
    const showEntityRules = useEntityBrowserSettings((store) => store.showEntityRules)
    const showIdInsteadOfName = useEntityBrowserSettings((store) => store.showIdInsteadOfName)
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const entity = useEditorState((state) => state.entities.get(props.entityId))
    const diff = useEditorState((state) => state.getEntityDiff(props.entityId))
    const activeRoles = useActiveEntityRules(props.entityId)

    const hasUnsavedChanges = useMemo(() => {
        return entity ? diff !== Diff.None : false
    }, [diff, entity])

    const openSelf = useCallback(() => {
        if (!entity) return
        openTab(createEntityEditorTab(entity), true)
    }, [openTab, entity])

    const activeRoleNames = useMemo(() => {
        if (!showEntityRules) return undefined
        return activeRoles?.map((role) => role.rule.name ?? role.rule["@id"]).join(", ")
    }, [activeRoles, showEntityRules])

    if (!entity) {
        console.warn(
            "EntityBrowserItem could not be rendered because the entity does not exist:",
            props.entityId
        )
        return null
    }

    return (
        <EntityContextMenu entity={entity} asChild>
            <Button size="sm" variant="list-entry" className="shrink-0" onClick={openSelf}>
                <EntityIcon entity={entity} unsavedChanges={hasUnsavedChanges} />
                <div className="truncate">
                    <span>
                        {showIdInsteadOfName ? props.entityId : getEntityDisplayName(entity)}
                    </span>
                    {showEntityType && !activeRoleNames ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                            {toArray(entity["@type"]).map(camelCaseReadable).join(", ")}
                        </span>
                    ) : null}
                    {activeRoleNames ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                            {activeRoleNames}
                        </span>
                    ) : null}
                </div>
            </Button>
        </EntityContextMenu>
    )
})
