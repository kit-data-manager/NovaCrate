import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SlimClass } from "@/lib/schema-worker/helpers"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { AutoReference } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { TypeSelect } from "@/components/modals/create-entity/type-select"
import { CreateEntity } from "@/components/modals/create-entity/create-entity"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { SimpleTypeSelect } from "@/components/modals/create-entity/simple-type-select"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { UploadProgress } from "@/components/modals/create-entity/upload-progress"
import { RO_CRATE_FILE } from "@/lib/constants"
import { asValidPath } from "@/lib/utils"
import { CreateProviders } from "@/components/modals/create-entity/create-providers"

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses,
    autoReference,
    forceId,
    basePath
}: {
    open: boolean
    onEntityCreated: (entity?: IEntity) => void
    onOpenChange: (open: boolean) => void
    restrictToClasses?: SlimClass[]
    autoReference?: AutoReference
    forceId?: string
    basePath?: string
}) {
    const addEntity = useEditorState.useAddEntity()
    const focusTab = useEntityEditorTabs((store) => store.focusTab)
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const { createFileEntity, createFolderEntity } = useContext(CrateDataContext)
    const context = useEditorState.useCrateContext()

    const [fullTypeBrowser, setFullTypeBrowser] = useState(false)
    const [selectedType, setSelectedType] = useState("")

    const [uploading, setUploading] = useState(false)
    const [currentUploadProgress, setCurrentUploadProgress] = useState(0)
    const [maxUploadProgress, setMaxUploadProgress] = useState(0)
    const [uploadErrors, setUploadErrors] = useState<unknown[]>([])

    const resetUploadState = useCallback(() => {
        setUploading(false)
        setCurrentUploadProgress(0)
        setMaxUploadProgress(0)
        setUploadErrors([])
    }, [])

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setSelectedType("")
                setFullTypeBrowser(false)
                resetUploadState()
            }, 200)
        }
    }, [forceId, open, resetUploadState, restrictToClasses])

    const onTypeSelect = useCallback((value: string) => {
        setSelectedType(value)
    }, [])

    const onCreate = useCallback(
        (id: string, name: string) => {
            const newEntity = addEntity(
                id,
                [selectedType],
                {
                    name
                },
                autoReference
            )
            if (newEntity) {
                onEntityCreated(newEntity)
                focusTab(id)
            }
        },
        [addEntity, autoReference, focusTab, onEntityCreated, selectedType]
    )

    const onProviderCreate = useCallback(
        (entityOrId: IEntity | string) => {
            onEntityCreated(typeof entityOrId === "object" ? entityOrId : undefined)
            if (typeof entityOrId === "string") {
                openTab({ entityId: entityOrId }, true)
            } else {
                focusTab(entityOrId["@id"])
            }
        },
        [focusTab, onEntityCreated, openTab]
    )

    const onUploadFile = useCallback(
        async (id: string, name: string, file: File) => {
            setUploading(true)
            setMaxUploadProgress(1)
            try {
                const result = await createFileEntity(
                    {
                        "@id": id,
                        "@type": selectedType,
                        name
                    },
                    file
                )
                if (!result) setUploadErrors(["File upload failed"])
                else {
                    setCurrentUploadProgress(1)
                    onOpenChange(false)
                }
            } catch (e) {
                setUploadErrors([e])
            }
        },
        [createFileEntity, onOpenChange, selectedType]
    )

    const onUploadFolder = useCallback(
        async (id: string, name: string, files: File[]) => {
            console.log("Uploading folder", id, name, files)
            setUploading(true)
            setMaxUploadProgress(files.length > 0 ? files.length : 1)
            try {
                const result = await createFolderEntity(
                    {
                        "@id": asValidPath(id, true),
                        "@type": selectedType,
                        name
                    },
                    files.map((file) => {
                        return {
                            entity: {
                                "@id":
                                    asValidPath(id, true) +
                                    file.webkitRelativePath.split("/").slice(1).join("/"),
                                "@type": context.reverse(RO_CRATE_FILE) || RO_CRATE_FILE,
                                name: file.name
                            },
                            file
                        }
                    }),
                    (current, max, errors) => {
                        setCurrentUploadProgress(current)
                        setMaxUploadProgress(max)
                        setUploadErrors(errors)
                    }
                )
                if (!result) setUploadErrors(["Folder upload failed"])
                else {
                    setCurrentUploadProgress(files.length > 0 ? files.length : 1)
                    onOpenChange(false)
                }
            } catch (e) {
                setUploadErrors([e])
            }
        },
        [context, createFolderEntity, onOpenChange, selectedType]
    )

    const backToTypeSelect = useCallback(() => {
        setSelectedType("")
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    "transition-none " +
                    (!selectedType && !fullTypeBrowser ? "max-w-[1000px]!" : "")
                }
            >
                {uploading ? (
                    <UploadProgress
                        current={currentUploadProgress}
                        max={maxUploadProgress}
                        errors={uploadErrors}
                    />
                ) : !selectedType ? (
                    fullTypeBrowser ? (
                        <TypeSelect
                            open={open}
                            restrictToClasses={restrictToClasses}
                            onTypeSelect={onTypeSelect}
                            setFullTypeBrowser={setFullTypeBrowser}
                        />
                    ) : (
                        <SimpleTypeSelect
                            onTypeSelect={onTypeSelect}
                            onOpenChange={onOpenChange}
                            setFullTypeBrowser={setFullTypeBrowser}
                            restrictToClasses={restrictToClasses}
                        />
                    )
                ) : (
                    <CreateProviders
                        selectedType={selectedType}
                        backToTypeSelect={backToTypeSelect}
                        onProviderCreate={onProviderCreate}
                        autoReference={autoReference}
                        fallback={
                            <CreateEntity
                                onBackClick={backToTypeSelect}
                                onCreateClick={onCreate}
                                forceId={forceId}
                                selectedType={selectedType}
                                basePath={basePath}
                                onUploadFile={onUploadFile}
                                onUploadFolder={onUploadFolder}
                            />
                        }
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
