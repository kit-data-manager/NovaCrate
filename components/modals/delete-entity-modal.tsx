import React, { memo, useCallback, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon, ArrowLeft, Loader2, Trash } from "lucide-react"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import { useCrateMutations } from "@/lib/use-crate-mutations"
import { usePersistence } from "@/components/providers/persistence-provider"
import { useCore } from "@/components/providers/core-provider"
import {
    getEntityDisplayName,
    isContextualEntity,
    isFileDataEntity,
    normalizeIdentifier
} from "@/lib/utils"
import { Error } from "@/components/error"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import useSWR from "swr"

export const DeleteEntityModal = memo(function DeleteEntityModal({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    entityId: string
}) {
    const entity = useEditorState((store) => store.entities.get(entityId))
    const { deleteEntity } = useCrateMutations()
    const persistence = usePersistence()
    const core = useCore()
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<unknown>()
    const [deleteContent, setDeleteContent] = useState(false)

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!isDeleting) onOpenChange(isOpen)
            if (!isOpen)
                setTimeout(() => {
                    setDeleteError(undefined)
                }, 300)
        },
        [isDeleting, onOpenChange]
    )

    const onDeleteEntityClick = useCallback(() => {
        if (entity) {
            setIsDeleting(true)
            deleteEntity(entity, deleteContent)
                .then((success: boolean) => {
                    if (success) {
                        setDeleteError(undefined)
                        onOpenChange(false)
                    } else setDeleteError("Unknown error while deleting")
                })
                .catch((e: unknown) => {
                    console.error(e)
                    setDeleteError(e)
                })
                .finally(() => {
                    setIsDeleting(false)
                })
        } else {
            // Attempt to delete anyway. The user was able to access the delete button, so there must be something here...
            // Assumes the type to be a file, since files can exist without having an entity
            onOpenChange(false)
            setIsDeleting(true)
            core.deleteEntity(entityId, deleteContent)
                .then(() => {
                    setDeleteError(undefined)
                    onOpenChange(false)
                })
                .catch((e: unknown) => {
                    console.error(e)
                    setDeleteError(e)
                })
                .finally(() => {
                    setIsDeleting(false)
                })
        }
    }, [entity, core, deleteEntity, onOpenChange, entityId, deleteContent])

    const couldHaveFile = useMemo(() => {
        return entity ? !isContextualEntity(entity) : true
    }, [entity])

    const couldBeFileEntity = useMemo(() => {
        return entity ? isFileDataEntity(entity) : false
    }, [entity])

    const impactedEntitiesCount = useMemo(() => {
        if (entity && couldBeFileEntity) {
            return 1
        } else if (entity && !couldBeFileEntity) {
            if (!deleteContent) return 1

            return Array.from(editorState.getState().getEntities()).filter(([id]) =>
                normalizeIdentifier(id).startsWith(normalizeIdentifier(entity["@id"]))
            ).length
        } else return 0
    }, [couldBeFileEntity, deleteContent, entity])

    const getImpactedFileOrFolderCount = useCallback(async () => {
        const fileService = persistence.getCrateService()?.getFileService()
        if (!fileService) return 0

        const list = await fileService.getContentList()
        const paths = list.map((f) => f.path)
        if (entityId.endsWith("/")) {
            return paths.filter((path: string) =>
                normalizeIdentifier(path).startsWith(normalizeIdentifier(entityId))
            ).length
        } else {
            return paths.filter(
                (path: string) => normalizeIdentifier(path) === normalizeIdentifier(entityId)
            ).length
        }
    }, [entityId, persistence])

    const crateId = persistence.getCrateId()

    const { data: impactedFileOrFolderCount } = useSWR(
        crateId ? `impacted-file-or-folder-count-${entityId}-${crateId}` : null,
        getImpactedFileOrFolderCount,
        {}
    )

    const onCloseClick = useCallback(() => {
        onOpenChange(false)
    }, [onOpenChange])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <Error title="An error occured while deleting this entity" error={deleteError} />
                <div>
                    <div>
                        Are you sure that you want to delete this entity? This action is not
                        reversible.
                    </div>
                    <div className="p-1 px-2 my-3 inline-flex items-center border rounded-lg">
                        <EntityIcon entity={entity} />
                        <span className="break-keep">
                            {getEntityDisplayName(entity || { "@id": entityId, "@type": [] }, true)}
                        </span>
                    </div>
                </div>
                {couldHaveFile ? (
                    <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                            id="delete-content"
                            checked={deleteContent}
                            onCheckedChange={(v) =>
                                setDeleteContent(v === "indeterminate" ? true : v)
                            }
                        />
                        <Label htmlFor="delete-content" className="mb-0">
                            Permanently delete corresponding{" "}
                            {couldBeFileEntity ? "file" : "folder and all contained data"}
                        </Label>
                    </div>
                ) : null}
                <Alert>
                    <AlertTriangleIcon />
                    <AlertTitle>Impact</AlertTitle>
                    <AlertDescription>
                        <div>
                            {impactedEntitiesCount} Entit{impactedEntitiesCount === 1 ? "y" : "ies"}{" "}
                            will be deleted
                        </div>
                        <div>
                            {deleteContent ? impactedFileOrFolderCount || "?" : "0"} File(s) or
                            Folder(s) will be deleted
                        </div>
                    </AlertDescription>
                </Alert>
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onCloseClick} disabled={isDeleting}>
                        <ArrowLeft className="size-4 mr-2" /> Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDeleteEntityClick}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                            <Trash className="size-4 mr-2" />
                        )}{" "}
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
})
