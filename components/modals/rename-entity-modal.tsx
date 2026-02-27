import React, { memo, useCallback, useContext, useMemo, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useEditorState } from "@/lib/state/editor-state"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon, ExternalLink, LoaderCircle } from "lucide-react"
import { isDataEntity, isFolderDataEntity } from "@/lib/utils"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { Error } from "@/components/error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const RenameEntityModal = memo(function RenameEntityModal({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    entityId: string
}) {
    const entity = useEditorState((store) => store.entities.get(entityId))
    const { renameEntity } = useContext(CrateDataContext)
    const openTab = useEntityEditorTabs((state) => state.openTab)

    const isFile = useMemo(() => {
        if (!entity) return false
        return isDataEntity(entity)
    }, [entity])

    const [newId, setNewId] = useState(entityId)
    const [error, setError] = useState<unknown>()
    const [loading, setLoading] = useState(false)

    const localOpenChange = useCallback(
        (open: boolean) => {
            onOpenChange(open)
            if (!open) {
                setNewId("")
            }
        },
        [onOpenChange]
    )

    const onConfirm = useCallback(async () => {
        if (!entity) return
        if (newId === entityId) return
        if (newId.trim().length < 1) {
            setError("Invalid identifier")
            return
        }

        if (newId.endsWith("/") && !isFolderDataEntity(entity)) {
            setError("Identifier must not end with a slash if the entity is not a dataset")
            return
        }

        if (!newId.endsWith("/") && isFolderDataEntity(entity)) {
            setError("Dataset identifiers must end with a slash")
            return
        }

        setLoading(true)
        try {
            const success = await renameEntity(entity, newId)
            if (success) {
                const copy = structuredClone(entity)
                copy["@id"] = newId
                openTab(createEntityEditorTab(copy), true)
            } else {
                console.warn("Entity rename unsuccessful")
            }
        } catch (e) {
            console.error(e)
            setError(e)
        }
        setLoading(false)
    }, [entity, entityId, newId, openTab, renameEntity])

    return (
        <Dialog open={open} onOpenChange={localOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Entity</DialogTitle>
                    <DialogDescription>
                        This will also rename all references to this entity. If this entity
                        describes a file or folder, it will also be renamed accordingly.
                    </DialogDescription>
                </DialogHeader>

                <Error error={error} title="Rename failed" />

                <div>
                    <Label>New Identifier</Label>
                    <Input
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                        placeholder={"#localname or https://..."}
                    />
                    <a
                        href={
                            isFile
                                ? "https://www.researchobject.org/ro-crate/specification/1.1/data-entities.html"
                                : "https://www.researchobject.org/ro-crate/specification/1.1/contextual-entities.html#identifiers-for-contextual-entities"
                        }
                        target="_blank"
                        className="text-sm inline-flex pt-1 text-muted-foreground hover:underline"
                    >
                        How to find a good identifier <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                </div>

                <Alert>
                    <AlertTriangleIcon />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                        This action is permanent and can not be undone. It will also rename any
                        files or folders with the same identifier as this entity. Save your changes
                        before continuing.
                    </AlertDescription>
                </Alert>

                <div className="flex justify-between mt-4">
                    <Button variant="secondary" onClick={() => localOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={loading}>
                        {loading ? <LoaderCircle className="size-4 mr-2 animate-spin" /> : null}{" "}
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
})
