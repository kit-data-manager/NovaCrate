import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { Button } from "../ui/button"
import { ArrowLeft, File, Folder, PackagePlus, XIcon } from "lucide-react"
import { usePersistence } from "@/components/providers/persistence-provider"
import { CrateFactory } from "@/lib/core/impl/CrateFactory"
import { sum } from "@/lib/utils"
import prettyBytes from "pretty-bytes"
import { UploadProgressBar } from "@/components/upload-progress-bar"

export function CreateCrateModal({
    open,
    onOpenChange,
    fromFile,
    openEditor
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    fromFile?: File
    openEditor(id: string): void
}) {
    const persistence = usePersistence()
    const factory = useMemo(() => new CrateFactory(persistence), [persistence])

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<unknown>()
    const [currentProgress, setCurrentProgress] = useState(0)
    const [maxProgress, setMaxProgress] = useState(0)
    const [uploadErrors, setUploadErrors] = useState<string[]>([])
    const createFolderUploadInputRef = useRef<HTMLInputElement>(null)
    const createFileUploadInputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<File[]>([])
    const [filesSource, setFilesSource] = useState<"folderUpload" | "fileUpload" | undefined>()

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!uploading) {
                onOpenChange(isOpen)
                setError(undefined)
            }
        },
        [onOpenChange, uploading]
    )

    const onCreateFolderUploadInputChange = useCallback(() => {
        setFiles([...(createFolderUploadInputRef.current?.files ?? [])])
        setFilesSource("folderUpload")
    }, [])

    const onCreateFileUploadInputChange = useCallback(() => {
        setFiles([...(createFileUploadInputRef.current?.files ?? [])])
        setFilesSource("fileUpload")
    }, [])

    const clearFiles = useCallback(() => {
        setFiles([])
        setFilesSource(undefined)
    }, [])

    const createCrateFromCrateFiles = useCallback(() => {
        if (files.length > 0) {
            setUploading(true)
            setUploadErrors([])
            factory
                .createCrateFromFiles(
                    name,
                    description,
                    [...files].map((file) => ({
                        relativePath: file.webkitRelativePath || file.name,
                        data: file
                    })),
                    (current: number, max: number, errors: string[]) => {
                        setCurrentProgress(current)
                        setMaxProgress(max)
                        setUploadErrors(errors)
                        if (errors.length > 0) console.error(errors)
                    }
                )
                .then((id: string) => {
                    openEditor(id)
                })
                .catch((e: unknown) => {
                    setUploading(false)
                    setError(e)
                })
        }
    }, [files, factory, name, description, openEditor])

    const createEmptyCrate = useCallback(() => {
        setUploading(true)
        setCurrentProgress(0)
        setMaxProgress(1)
        setUploadErrors([])
        factory
            .createEmptyCrate(name, description)
            .then((id: string) => {
                setCurrentProgress(1)
                openEditor(id)
            })
            .catch((e: unknown) => {
                setUploading(false)
                setError(e)
            })
    }, [factory, name, description, openEditor])

    const createFromFileLocked = useRef(false)
    const createCrateFromFile = useCallback(() => {
        if (fromFile && !createFromFileLocked.current) {
            createFromFileLocked.current = true

            setUploading(true)
            setCurrentProgress(0)
            setMaxProgress(1)
            setUploadErrors([])
            factory
                .createCrateFromFile(fromFile)
                .then((id: string) => {
                    setCurrentProgress(1)
                    openEditor(id)
                })
                .catch((e: unknown) => {
                    setUploading(false)
                    setError(e)
                })
        }
    }, [fromFile, factory, openEditor])

    useEffect(() => {
        createCrateFromFile()
    }, [createCrateFromFile])

    useEffect(() => {
        if (!open) {
            createFromFileLocked.current = false
        }
    }, [open])

    useEffect(() => {
        setName((old) => {
            if (old === "" && files.length > 0 && filesSource === "folderUpload")
                return files[0].webkitRelativePath.split("/")[0]
            else return old
        })
    }, [files, filesSource])

    const onCreateClick = useCallback(() => {
        if (files.length > 0) {
            createCrateFromCrateFiles()
        } else {
            createEmptyCrate()
        }
    }, [createCrateFromCrateFiles, createEmptyCrate, files.length])

    const openFolderPicker = useCallback(() => {
        if (createFolderUploadInputRef.current) {
            createFolderUploadInputRef.current.setAttribute("webkitdirectory", "true")
            createFolderUploadInputRef.current.click()
        }
    }, [])

    const openFilePicker = useCallback(() => {
        if (createFileUploadInputRef.current) {
            createFileUploadInputRef.current.click()
        }
    }, [])

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

                        <div>
                            <Label>
                                Upload Data
                                <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                {filesSource !== "fileUpload" && (
                                    <Button variant="outline" onClick={openFolderPicker}>
                                        <Folder className="size-4 mr-2" />{" "}
                                        {files.length == 0
                                            ? "Select Folder"
                                            : files[0].webkitRelativePath.split("/")[0]}
                                    </Button>
                                )}
                                {filesSource == undefined && <span>or</span>}
                                {filesSource !== "folderUpload" && (
                                    <Button variant="outline" onClick={openFilePicker}>
                                        <File className="size-4 mr-2" />{" "}
                                        {files.length == 0
                                            ? "Select File"
                                            : files.length + " Files"}
                                    </Button>
                                )}
                                {filesSource != undefined && (
                                    <Button
                                        variant="ghost"
                                        onClick={clearFiles}
                                        disabled={uploading}
                                    >
                                        <XIcon />
                                    </Button>
                                )}
                            </div>
                            {files.length > 0 && (
                                <div className="pt-1 text-muted-foreground text-sm">
                                    {`${files.length} file${files.length === 1 ? "" : "s"} selected (${prettyBytes([...files].map((f) => f.size).reduce(sum))} total)`}
                                </div>
                            )}
                        </div>

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

                        <div className="mt-4 flex justify-between">
                            <Button variant="secondary" onClick={() => localOnOpenChange(false)}>
                                <ArrowLeft className="size-4 mr-2" /> Abort
                            </Button>
                            <Button onClick={onCreateClick}>
                                <PackagePlus className="size-4 mr-2" /> Create
                            </Button>
                        </div>
                    </>
                )}

                <input
                    type="file"
                    className="hidden"
                    multiple={true}
                    data-testid="create-folder-upload-input"
                    ref={createFolderUploadInputRef}
                    onChange={onCreateFolderUploadInputChange}
                />
                <input
                    type="file"
                    className="hidden"
                    multiple={true}
                    data-testid="create-file-upload-input"
                    ref={createFileUploadInputRef}
                    onChange={onCreateFileUploadInputChange}
                />
            </DialogContent>
        </Dialog>
    )
}
