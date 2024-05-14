import React, { useCallback, useContext, useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Error } from "../error"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useFilePicker } from "use-file-picker"
import { Button } from "../ui/button"
import { ArrowLeft, Folder, PackagePlus } from "lucide-react"
import { CrateDataContext } from "../crate-data-provider"
import { Progress } from "../ui/progress"

// TODO prevent closing? What happens in case of error?

export function CreateCrateModal({
    open,
    onOpenChange,
    fromFolder,
    fromExample,
    openEditor
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    fromFolder: boolean
    fromExample?: string
    openEditor(id: string): void
}) {
    const { serviceProvider } = useContext(CrateDataContext)

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")
    const [currentProgress, setCurrentProgress] = useState(0)
    const [maxProgress, setMaxProgress] = useState(0)
    const [uploadErrors, setUploadErrors] = useState<string[]>([])
    const { openFilePicker: openFolderPicker, plainFiles: files } = useFilePicker({
        initializeWithCustomParameters(input) {
            input.setAttribute("webkitdirectory", "")
        }
    })

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!uploading) {
                onOpenChange(isOpen)
            }
        },
        [onOpenChange, uploading]
    )

    const createCrateFromCrateFiles = useCallback(() => {
        if (files.length > 0 && serviceProvider) {
            setUploading(true)
            serviceProvider
                .createCrateFromFiles(name, description, files, (current, max, errors) => {
                    setCurrentProgress(current)
                    setMaxProgress(max)
                    setUploadErrors(errors)
                })
                .then((id) => {
                    openEditor(id)
                })
                .catch((e) => {
                    setUploading(false)
                    setError(e.toString())
                })
        }
    }, [files, serviceProvider, name, description, openEditor])

    const createEmptyCrate = useCallback(() => {
        if (serviceProvider) {
            serviceProvider
                .createCrate(name, description)
                .then((id) => {
                    openEditor(id)
                })
                .catch((e) => {
                    setError(e.toString())
                })
        }
    }, [serviceProvider, name, description, openEditor])

    const onCreateClick = useCallback(() => {
        if (fromExample) {
        } else if (fromFolder) {
            createCrateFromCrateFiles()
        } else {
            createEmptyCrate()
        }
    }, [createCrateFromCrateFiles, createEmptyCrate, fromExample, fromFolder])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new Crate</DialogTitle>
                </DialogHeader>
                {fromExample ? (
                    <DialogDescription>Using Example: {fromExample}</DialogDescription>
                ) : null}

                {uploading ? (
                    <>
                        <div>
                            Uploading: {currentProgress}/{maxProgress || "?"}
                        </div>
                        <Progress value={currentProgress} max={maxProgress} />
                        {uploadErrors.map((error, i) => (
                            <Error prefix="A file failed to upload: " key={i} text={error} />
                        ))}
                    </>
                ) : (
                    <>
                        <Error text={error} />
                        <div>
                            <Label>Name</Label>
                            <Input
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {fromFolder ? (
                            <div>
                                <Button>
                                    <Folder className="w-4 h-4 mr-2" /> Select Folder
                                    <span>
                                        {files.length > 0
                                            ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                                            : "No files selected"}
                                    </span>
                                </Button>
                            </div>
                        ) : null}

                        <div>
                            <Button onClick={() => localOnOpenChange(false)}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Abort
                            </Button>
                            <Button onClick={onCreateClick}>
                                <PackagePlus className="w-4 h-4 mr-2" /> Create
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
