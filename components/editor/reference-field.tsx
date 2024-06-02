import { memo, useCallback, useContext, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { SelectReferenceModal } from "@/components/editor/select-reference-modal"
import { ExternalLink, Eye, LinkIcon, Plus } from "lucide-react"
import { getEntityDisplayName } from "@/lib/utils"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { SlimClass } from "@/lib/crate-verify/helpers"
import {
    createEntityEditorTab,
    EntityEditorTabsContext
} from "@/components/providers/entity-tabs-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { EntityIcon } from "@/components/entity-icon"
import { PropertyEditorTypes } from "@/components/editor/property-editor"

export const ReferenceField = memo(function ReferenceField({
    entityId,
    value,
    onChange,
    onChangeType,
    valueIdx,
    propertyRange,
    onRemoveEntry,
    propertyName
}: {
    entityId: string
    value: IReference
    onChange: (value: IReference) => void
    onChangeType: (type: PropertyEditorTypes) => void
    propertyName: string
    valueIdx: number
    propertyRange?: SlimClass[]
    onRemoveEntry: () => void
}) {
    const referencedEntity = useEditorState((store) => store.entities.get(value["@id"]))
    const { showCreateEntityModal } = useContext(GlobalModalContext)
    const { openTab } = useContext(EntityEditorTabsContext)

    const [selectModalOpen, setSelectModalOpen] = useState(false)

    const onCreateClick = useCallback(() => {
        showCreateEntityModal(propertyRange, {
            entityId,
            propertyName,
            valueIdx
        })
    }, [entityId, propertyName, propertyRange, showCreateEntityModal, valueIdx])

    const onSelect = useCallback(
        (selection: IReference) => {
            onChange(selection)
        },
        [onChange]
    )

    const openInNewTab = useCallback(() => {
        if (!referencedEntity) {
            if (value["@id"].startsWith("http")) {
                window.open(value["@id"], "_blank")
            }
            return
        }
        openTab(createEntityEditorTab(referencedEntity), true)
    }, [openTab, referencedEntity, value])

    const isEmpty = useMemo(() => {
        return value["@id"] === ""
    }, [value])

    const referencedEntityName = useMemo(() => {
        if (referencedEntity) return getEntityDisplayName(referencedEntity)
    }, [referencedEntity])

    const ReferenceText = useCallback(() => {
        if (referencedEntityName) {
            return <span className="truncate">{referencedEntityName}</span>
        } else {
            return <span className="text-root">Unresolved</span>
        }
    }, [referencedEntityName])

    return (
        <div className="flex w-full">
            <SelectReferenceModal
                open={selectModalOpen}
                onSelect={onSelect}
                onOpenChange={setSelectModalOpen}
                propertyRange={propertyRange}
            />

            {isEmpty ? (
                <>
                    <Button
                        className="grow rounded-r-none border-r-0 first:rounded-l-md rounded-l-none"
                        variant="outline"
                        onClick={() => onCreateClick()}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                    </Button>
                    <Button
                        className="grow rounded-none"
                        variant="outline"
                        onClick={() => {
                            setSelectModalOpen(true)
                        }}
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Select
                    </Button>
                </>
            ) : (
                <>
                    <Button
                        className="grow rounded-r-none justify-start pl-3 truncate"
                        variant="outline"
                        onClick={openInNewTab}
                    >
                        <EntityIcon entity={referencedEntity} />
                        <div className="flex items-end truncate grow">
                            <ReferenceText />
                            <span className="text-muted-foreground ml-1 text-xs truncate">
                                {value["@id"]}
                            </span>
                            <div className="flex items-center self-center grow justify-end">
                                <Eye className="w-4 h-4" />
                            </div>
                        </div>
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectModalOpen(true)
                        }}
                        size="icon"
                        variant="outline"
                        className="rounded-none border-l-0 shrink-0"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </Button>
                </>
            )}

            <SinglePropertyDropdown
                propertyRange={propertyRange}
                isReference
                onModifyReferenceProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
            />
        </div>
    )
})
