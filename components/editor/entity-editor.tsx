"use client"

import { useCallback, useContext, useMemo, useState } from "react"
import { PropertyEditor } from "@/components/editor/property-editor"
import {
    getEntityDisplayName,
    isDataEntity as isDataEntityUtil,
    isRootEntity as isRootEntityUtil,
    toArray
} from "@/lib/utils"
import { WebWorkerWarning } from "@/components/web-worker-warning"
import { TEST_CONTEXT } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { EntityEditorHeader } from "@/components/editor/entity-editor-header"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { AddPropertyModal, PossibleProperty } from "@/components/editor/add-property-modal"
import { EntityEditorProps } from "@/components/editor/use-virtual-entity-editor"

/**
 *  The state of this component has been virtualized in a custom React Hook, used by
 *  VirtualizedEntityEditor. This ensures that the entity editor stays functional even if
 *  it is not being rendered. This enables features like save-all, where each editor takes
 *  care of saving their own entity separately. By virtualizing the state and moving it into
 *  VirtualEntityEditor, functions like saveChanges or removeProperty will work even if the editor
 *  is not rendered.
 *
 *  TLDR: This component is purely a renderer, and does not take care of its own state. For the
 *  entity editor state, look at VirtualEntityEditor and useVirtualEntityEditorState
 *
 *  This design was chosen because this Component (EntityEditor) can get very expensive in terms of
 *  render time. By only rendering one entity editor at a time while also being able to manipulate
 *  the state of all other entity editors (=tabs), we improve performance significantly without any
 *  drawbacks. (The only drawback is this large comment to explain everything)
 */
export function EntityEditor({
    entityData,
    editorState,
    addProperty,
    addPropertyEntry,
    modifyProperty,
    revertChanges,
    removeProperty,
    isSaving,
    saveError,
    saveChanges,
    hasUnsavedChanges,
    propertyHasChanges
}: EntityEditorProps) {
    const { isReady: crateVerifyReady, getClassProperties } = useContext(CrateVerifyContext)

    const [addPropertyModelOpen, setAddPropertyModelOpen] = useState(false)

    const addPropertyModelOpenChange = useCallback((isOpen: boolean) => {
        setAddPropertyModelOpen(isOpen)
    }, [])

    const openAddPropertyModal = useCallback(() => {
        setAddPropertyModelOpen(true)
    }, [])

    const possiblePropertiesResolver = useCallback(
        async (types: string[]) => {
            if (crateVerifyReady) {
                const resolved = types
                    .map((type) => TEST_CONTEXT.resolve(type))
                    .filter((s) => typeof s === "string") as string[]
                const data = await getClassProperties(resolved)
                return data
                    .map((s) => {
                        return {
                            ...s,
                            range: s.range.map((r) => r["@id"]),
                            rangeReadable: s.range
                                .map((r) => r["@id"])
                                .map((r) => TEST_CONTEXT.reverse(r))
                                .filter((r) => typeof r === "string"),
                            propertyName: TEST_CONTEXT.reverse(s["@id"])
                        }
                    })
                    .filter((s) => typeof s.propertyName === "string") as PossibleProperty[]
            }
        },
        [crateVerifyReady, getClassProperties]
    )

    const typeArray = useMemo(() => {
        return toArray(entityData["@type"])
    }, [entityData])

    const {
        data: possibleProperties,
        error: possiblePropertiesError,
        isPending: possiblePropertiesPending
    } = useAsync(crateVerifyReady ? typeArray : null, possiblePropertiesResolver)

    const isRootEntity = useMemo(() => {
        return isRootEntityUtil(entityData)
    }, [entityData])

    const isDataEntity = useMemo(() => {
        return isDataEntityUtil(entityData)
    }, [entityData])

    return (
        <div className="relative">
            <AddPropertyModal
                open={addPropertyModelOpen}
                onPropertyAdd={addProperty}
                onOpenChange={addPropertyModelOpenChange}
                possibleProperties={possibleProperties}
                possiblePropertiesPending={possiblePropertiesPending}
            />

            <EntityEditorHeader
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                saveChanges={saveChanges}
                revertChanges={revertChanges}
            />

            <div className="p-4 mr-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold flex items-center">
                        {getEntityDisplayName(entityData)}

                        <div
                            className={`${isRootEntity ? "border-root text-root" : isDataEntity ? "border-data text-data" : "border-contextual text-contextual"}  border px-1.5 rounded ml-6 text-sm`}
                        >
                            {isRootEntity ? "Root" : isDataEntity ? "Data" : "Contextual"}
                        </div>
                        {/*<div className="border-success border text-success px-1.5 rounded ml-2 text-sm flex gap-1 items-center">*/}
                        {/*    <Check className="w-4 h-4" /> ORCID*/}
                        {/*</div>*/}
                    </h2>

                    {/*<div className="flex items-center mr-2">*/}
                    {/*    <Switch id="easy-mode" />*/}
                    {/*    <Label className="p-2" htmlFor="easy-mode">*/}
                    {/*        Easy Mode*/}
                    {/*    </Label>*/}
                    {/*</div>*/}
                </div>

                <WebWorkerWarning />
                <Error
                    className="mt-4"
                    text={saveError ? "Error while saving: " + saveError : ""}
                />
                <Error
                    className="mt-4"
                    text={
                        possiblePropertiesError
                            ? "Error while determining properties: " + possiblePropertiesError
                            : ""
                    }
                />

                <div className="my-12 flex flex-col gap-10 mr-2">
                    {editorState.map((property, i) => {
                        return (
                            <div key={property.propertyName}>
                                <PropertyEditor
                                    property={property}
                                    onModifyProperty={modifyProperty}
                                    onAddPropertyEntry={addPropertyEntry}
                                    hasChanges={propertyHasChanges[i] === "hasChanges"}
                                    isNew={propertyHasChanges[i] === "isNew"}
                                    onRemovePropertyEntry={removeProperty}
                                />
                            </div>
                        )
                    })}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={openAddPropertyModal}
                    >
                        <Plus className={"w-4 h-4 mr-1"} /> Add Property
                    </Button>
                </div>
            </div>
        </div>
    )
}
