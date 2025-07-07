import { memo, useCallback, useContext, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { SelectReferenceModal } from "@/components/editor/select-reference-modal"
import { ExternalLink, Eye, LinkIcon, Plus, PlusIcon } from "lucide-react"
import { getEntityDisplayName } from "@/lib/utils"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useEditorState } from "@/lib/state/editor-state"
import { EntityIcon } from "@/components/entity/entity-icon"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function undefinedIfEmpty<T>(arr?: T[]) {
    if (arr?.length === 0) {
        return undefined
    } else return arr
}

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
    const openTab = useEntityEditorTabs((store) => store.openTab)

    const [selectModalOpen, setSelectModalOpen] = useState(false)

    const onCreateClick = useCallback(() => {
        showCreateEntityModal(undefinedIfEmpty(propertyRange), {
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
            return <span className="text-root">Unlinked</span>
        }
    }, [referencedEntityName])

    return (
        <div className="flex w-full max-w-full min-w-0 overflow-none">
            <SelectReferenceModal
                open={selectModalOpen}
                onSelect={onSelect}
                onOpenChange={setSelectModalOpen}
                propertyRange={undefinedIfEmpty(propertyRange)}
            />

            {isEmpty ? (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="grow rounded-r-none border-r-0 first:rounded-l-md rounded-l-none"
                                variant="outline"
                                onClick={() => onCreateClick()}
                            >
                                <Plus className="size-4 mr-2" />
                                Create
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Create a new Entity that will be added to the Crate and reference by
                            this property.
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="grow rounded-none"
                                variant="outline"
                                onClick={() => {
                                    setSelectModalOpen(true)
                                }}
                            >
                                <LinkIcon className="size-4 mr-2" />
                                Select
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Reference an Entity that already exists in the Crate
                        </TooltipContent>
                    </Tooltip>
                </>
            ) : (
                <>
                    <Button
                        className="shrink grow rounded-r-none justify-start pl-2 truncate min-w-0"
                        variant="outline"
                        onClick={openInNewTab}
                    >
                        <EntityIcon className="mr-1" entity={referencedEntity} />
                        <div className="flex items-end truncate grow">
                            <ReferenceText />
                            <span className="text-muted-foreground ml-1 text-xs truncate">
                                {value["@id"]}
                            </span>
                            <div className="flex items-center self-center grow justify-end">
                                {referencedEntity ? (
                                    <Eye className="size-4" />
                                ) : (
                                    <ExternalLink className="size-4" />
                                )}
                            </div>
                        </div>
                    </Button>
                    {!referencedEntity && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-none border-l-0"
                                    size="icon"
                                    onClick={onCreateClick}
                                >
                                    <PlusIcon className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Create a new Entity that will be added to the Crate and reference by
                                this property.
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => {
                                    setSelectModalOpen(true)
                                }}
                                size="icon"
                                variant="outline"
                                className="rounded-none border-l-0 shrink-0"
                            >
                                <LinkIcon className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Reference an Entity that already exists in the Crate
                        </TooltipContent>
                    </Tooltip>
                </>
            )}

            <SinglePropertyDropdown
                propertyRange={propertyRange}
                isReference
                onModifyReferenceProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyEditorTypes.Reference}
            />
        </div>
    )
})
