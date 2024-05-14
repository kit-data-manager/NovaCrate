import React, { useCallback, useContext, useState } from "react"
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
            setUploadErrors([])
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
            setUploading(true)
            setCurrentProgress(0)
            setMaxProgress(1)
            setUploadErrors([])
            serviceProvider
                .createCrate(name, description)
                .then((id) => {
                    setCurrentProgress(1)
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
                            Importing: {currentProgress}/{maxProgress || "?"}
                        </div>
                        <DialogDescription>Large files will take some time...</DialogDescription>
                        <Progress value={currentProgress * (100 / maxProgress)} />
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
                                <Label>Folder</Label>
                                <div>
                                    <Button variant="outline" onClick={openFolderPicker}>
                                        <Folder className="w-4 h-4 mr-2" />{" "}
                                        {files.length == 0
                                            ? "Select Folder"
                                            : files[0].webkitRelativePath.split("/")[0]}
                                    </Button>
                                    <span className="ml-2 text-muted-foreground">
                                        {files.length > 0
                                            ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                                            : "No files selected"}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4 flex justify-between">
                            <Button variant="secondary" onClick={() => localOnOpenChange(false)}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Abort
                            </Button>
                            <Button
                                onClick={onCreateClick}
                                disabled={fromFolder && files.length == 0}
                            >
                                <PackagePlus className="w-4 h-4 mr-2" /> Create
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
