import { memo, useCallback, useContext, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { SelectReferenceModal } from "@/components/editor/select-reference-modal"
import { ExternalLink, Globe, LinkIcon, Plus } from "lucide-react"
import { CreateFromORCIDModal } from "@/components/editor/from-orcid-modal"
import { getEntityDisplayName } from "@/lib/utils"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SCHEMA_ORG_ORGANIZATION, SCHEMA_ORG_PERSON } from "@/lib/constants"
import { GlobalModalContext } from "@/components/global-modals-provider"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { createEntityEditorTab, EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { useEditorState } from "@/components/editor-state"

export const ReferenceField = memo(function ReferenceField({
    entityId,
    value,
    onChange,
    valueIdx,
    propertyRange,
    onRemoveEntry,
    propertyName
}: {
    entityId: string
    value: IReference
    onChange: (value: IReference) => void
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
                    <CreateFromExternalButton propertyRange={propertyRange} />
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
                        onClick={() => {
                            setSelectModalOpen(true)
                        }}
                    >
                        <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                        <div className="flex items-end truncate">
                            <ReferenceText />
                            <span className="text-muted-foreground ml-1 text-xs truncate">
                                {value["@id"]}
                            </span>
                        </div>
                    </Button>
                    {referencedEntityName || value["@id"].startsWith("http") ? (
                        <Button
                            onClick={openInNewTab}
                            size="icon"
                            variant="outline"
                            className="rounded-none border-l-0"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    ) : null}
                </>
            )}

            <SinglePropertyDropdown
                propertyRange={propertyRange}
                isReference
                onModifyReferenceProperty={onChange}
                onRemoveEntry={onRemoveEntry}
            />
        </div>
    )
})

function CreateFromExternalButton({ propertyRange }: { propertyRange?: SlimClass[] }) {
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = useCallback(() => {
        setModalOpen(true)
    }, [])

    const propertyRangeIds = useMemo(() => {
        return propertyRange?.map((p) => p["@id"])
    }, [propertyRange])

    const fromORCID = useMemo(() => {
        if (!propertyRangeIds) return false
        return propertyRangeIds.includes(SCHEMA_ORG_PERSON)
    }, [propertyRangeIds])

    const fromROR = useMemo(() => {
        if (!propertyRangeIds) return false
        return propertyRangeIds.includes(SCHEMA_ORG_ORGANIZATION)
    }, [propertyRangeIds])

    return (
        <>
            {fromORCID ? (
                <>
                    <CreateFromORCIDModal
                        open={modalOpen}
                        onEntityCreated={() => {}}
                        onOpenChange={setModalOpen}
                    />
                    <Button
                        className="grow-[2] rounded-none first:rounded-l-lg"
                        onClick={openModal}
                    >
                        <Globe className="w-4 h-4 mr-2" /> From ORCID
                    </Button>
                </>
            ) : null}
            {fromROR ? (
                <>
                    <Button
                        className="grow-[2] rounded-none first:rounded-l-lg"
                        onClick={openModal}
                    >
                        <Globe className="w-4 h-4 mr-2" /> From ROR
                    </Button>
                </>
            ) : null}
        </>
    )
}
