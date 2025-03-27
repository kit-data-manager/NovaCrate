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
import { CrateDataContext } from "../providers/crate-data-provider"
import { sum } from "@/lib/utils"
import prettyBytes from "pretty-bytes"
import { UploadProgressBar } from "@/components/upload-progress-bar"

export function CreateCrateModal({
    open,
    onOpenChange,
    fromFolder,
    fromZip,
    openEditor
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    fromFolder: boolean
    fromZip?: File
    openEditor(id: string): void
}) {
    const { serviceProvider } = useContext(CrateDataContext)

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<unknown>()
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
                setError(undefined)
            }
        },
        [onOpenChange, uploading]
    )

    const createCrateFromCrateFiles = useCallback(() => {
        if (files.length > 0 && serviceProvider) {
            setUploading(true)
            setUploadErrors([])
            serviceProvider
                .createCrateFromFiles(
                    name,
                    description,
                    files.map((file) => ({ relativePath: file.webkitRelativePath, data: file })),
                    (current, max, errors) => {
                        setCurrentProgress(current)
                        setMaxProgress(max)
                        setUploadErrors(errors)
                    }
                )
                .then((id) => {
                    openEditor(id)
                })
                .catch((e) => {
                    setUploading(false)
                    setError(e)
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
                    setUploading(false)
                    setError(e)
                })
        }
    }, [serviceProvider, name, description, openEditor])

    const createCrateFromCrateZip = useCallback(() => {
        if (fromZip && serviceProvider) {
            setUploading(true)
            setCurrentProgress(0)
            setMaxProgress(1)
            setUploadErrors([])
            serviceProvider
                .createCrateFromCrateZip(fromZip)
                .then((id) => {
                    setCurrentProgress(1)
                    openEditor(id)
                })
                .catch((e) => {
                    setUploading(false)
                    setError(e)
                })
        }
    }, [fromZip, serviceProvider, openEditor])

    useEffect(() => {
        createCrateFromCrateZip()
    }, [createCrateFromCrateZip])

    useEffect(() => {
        setName((old) => {
            if (old === "" && files.length > 0) return files[0].webkitRelativePath.split("/")[0]
            else return old
        })
    }, [files])

    const onCreateClick = useCallback(() => {
        if (fromFolder) {
            createCrateFromCrateFiles()
        } else {
            createEmptyCrate()
        }
    }, [createCrateFromCrateFiles, createEmptyCrate, fromFolder])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new Crate</DialogTitle>
                    <DialogDescription>
                        You can always change the name and description later.
                    </DialogDescription>
                </DialogHeader>

                {uploading ? (
                    <UploadProgressBar
                        value={currentProgress}
                        max={maxProgress}
                        errors={uploadErrors}
                    />
                ) : (
                    <>
                        <Error title="Could not create a new Crate" error={error} />
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
                                            ? `${files.length} file${files.length === 1 ? "" : "s"} selected (${prettyBytes(files.map((f) => f.size).reduce(sum))} total)`
                                            : "No files selected"}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {!fromZip ? (
                            <>
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
                            </>
                        ) : null}

                        <div className="mt-4 flex justify-between">
                            <Button variant="secondary" onClick={() => localOnOpenChange(false)}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Abort
                            </Button>
                            <Button
                                onClick={onCreateClick}
                                disabled={(fromFolder && files.length == 0) || !!fromZip}
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
