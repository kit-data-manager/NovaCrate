import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useAutoId } from "@/components/use-auto-id"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, File, Folder, FolderDot, Plus } from "lucide-react"
import { useFilePicker } from "use-file-picker"
import { camelCaseReadable, encodeFilePath, fileNameWithoutEnding } from "@/lib/utils"
import { Error } from "@/components/error"
import prettyBytes from "pretty-bytes"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { useEditorState } from "@/components/editor-state"
import HelpTooltip from "@/components/help-tooltip"

export function CreateEntity({
    selectedType,
    onBackClick,
    onCreateClick,
    forceId,
    basePath,
    onUploadFile,
    onUploadFolder
}: {
    selectedType: string
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    forceId?: string
    basePath?: string
    onUploadFile(id: string, name: string, file: File): void
    onUploadFolder(id: string, name: string, files: File[]): void
}) {
    const context = useEditorState.useCrateContext()

    const fileUpload = useMemo(() => {
        return context.resolve(selectedType) === RO_CRATE_FILE
    }, [context, selectedType])

    const folderUpload = useMemo(() => {
        return context.resolve(selectedType) === RO_CRATE_DATASET
    }, [context, selectedType])

    const defaultName = useMemo(() => {
        if ((fileUpload || folderUpload) && forceId) {
            const split = forceId.split("/").filter((part) => !!part)
            return split[split.length - 1]
        } else return undefined
    }, [fileUpload, folderUpload, forceId])

    const [name, setName] = useState(defaultName || "")
    const [identifier, setIdentifier] = useState<null | string>(null)
    const [emptyFolder, setEmptyFolder] = useState(false)
    const { plainFiles, openFilePicker } = useFilePicker({})
    const { plainFiles: folderFiles, openFilePicker: openFolderPicker } = useFilePicker({
        initializeWithCustomParameters(input: HTMLInputElement) {
            input.setAttribute("webkitdirectory", "")
        }
    })

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    const _autoId = useAutoId(identifier || name)

    const autoId = useMemo(() => {
        return forceId || identifier || _autoId
    }, [_autoId, forceId, identifier])

    const hasFileUpload = useMemo(() => {
        return fileUpload && !forceId
    }, [fileUpload, forceId])

    const hasFolderUpload = useMemo(() => {
        return folderUpload && !forceId
    }, [folderUpload, forceId])

    const baseFileName = useMemo(() => {
        if (plainFiles.length > 0) {
            return plainFiles[0].name
        } else if (folderFiles.length > 0) {
            return folderFiles[0].webkitRelativePath.split("/")[0]
        } else return undefined
    }, [folderFiles, plainFiles])

    const path = useMemo(() => {
        return (
            (basePath || "") +
            (emptyFolder ? encodeFilePath(name.replaceAll("/", "")) : baseFileName || "")
        )
    }, [baseFileName, basePath, emptyFolder, name])

    const localOnCreateClick = useCallback(() => {
        if (!forceId && (hasFileUpload || hasFolderUpload)) {
            if (hasFileUpload) {
                onUploadFile(path, name, plainFiles[0])
            } else {
                onUploadFolder(path, name, emptyFolder ? [] : folderFiles)
            }
        } else onCreateClick(autoId, name)
    }, [
        autoId,
        emptyFolder,
        folderFiles,
        forceId,
        hasFileUpload,
        hasFolderUpload,
        name,
        onCreateClick,
        onUploadFile,
        onUploadFolder,
        path,
        plainFiles
    ])

    const onNameInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                localOnCreateClick()
            }
        },
        [localOnCreateClick]
    )

    useEffect(() => {
        if (plainFiles.length > 0) {
            setName((oldName) =>
                oldName === "" ? fileNameWithoutEnding(plainFiles[0].name) : oldName
            )
        }
    }, [plainFiles])

    useEffect(() => {
        if (folderFiles.length > 0) {
            setName((oldName) =>
                oldName === "" ? folderFiles[0].webkitRelativePath.split("/")[0] : oldName
            )
        }
    }, [folderFiles])

    if (hasFileUpload && hasFolderUpload)
        return (
            <Error error="Cannot determine whether this is a file upload or a folder upload. Make sure your context is not ambiguous." />
        )

    return (
        <div className="flex flex-col gap-4">
            <DialogHeader>
                <DialogTitle>Create a new {camelCaseReadable(selectedType)} Entity</DialogTitle>

                <DialogDescription>
                    {!hasFileUpload && !hasFolderUpload ? (
                        <>
                            Enter a name for the entity. A valid ID will automatically be generated.
                            You can also manually change the ID. Press the Create Button to start
                            adding Properties.
                        </>
                    ) : null}

                    {hasFileUpload ? (
                        <>
                            Add a file to the Crate. Use the File Explorer to upload the file to a
                            specific folder. This will import the File into the Crate and also
                            create a corresponding Data Entity.
                        </>
                    ) : null}

                    {hasFolderUpload ? (
                        <>
                            Add a folder to the Crate. Use the File Explorer to upload the folder to
                            a specific parent-folder. You can choose to also import all the files in
                            the selected folder. If you want to create an empty folder, select Empty
                            Folder and enter a name of your choice.
                        </>
                    ) : null}
                </DialogDescription>
            </DialogHeader>

            {hasFileUpload ? (
                <div>
                    <Label>File</Label>
                    <div>
                        <Button variant="outline" onClick={openFilePicker}>
                            <File className="w-4 h-4 mr-2" />
                            {plainFiles.length == 0 ? "Select File" : plainFiles[0].name}
                        </Button>
                        <span className="ml-2 text-muted-foreground">
                            {plainFiles.length == 0 ? "" : prettyBytes(plainFiles[0].size)}
                        </span>
                    </div>
                </div>
            ) : null}

            {hasFolderUpload ? (
                <div>
                    <Label>Folder</Label>
                    <div className="flex items-center">
                        {!emptyFolder ? (
                            <Button variant="outline" onClick={openFolderPicker}>
                                <Folder className="w-4 h-4 mr-2" />
                                {folderFiles.length == 0
                                    ? "Select Folder"
                                    : folderFiles[0].webkitRelativePath.split("/")[0]}
                            </Button>
                        ) : null}
                        {baseFileName || emptyFolder ? null : (
                            <span className="m-2 text-muted-foreground">or</span>
                        )}
                        {baseFileName ? null : (
                            <Button
                                variant={emptyFolder ? "default" : "outline"}
                                onClick={() => setEmptyFolder((v) => !v)}
                            >
                                <FolderDot className="w-4 h-4 mr-2" />
                                Empty Folder
                            </Button>
                        )}
                        <span className="ml-2 text-muted-foreground">
                            {folderFiles.length == 0
                                ? ""
                                : `${folderFiles.length} files (${prettyBytes(folderFiles.map((f) => f.size).reduce((a, b) => a + b))} total)`}
                        </span>
                    </div>
                </div>
            ) : null}

            {(hasFileUpload || hasFolderUpload) && !forceId ? (
                <div>
                    <Label className="flex gap-1 items-center py-1">
                        Path{" "}
                        <HelpTooltip>
                            The path where the file(s) will be located in the Crate. To upload to a
                            different path, use the File Explorer
                        </HelpTooltip>
                    </Label>
                    <Input value={path} disabled />
                </div>
            ) : null}

            {!hasFileUpload && !hasFolderUpload && !forceId ? (
                <div>
                    <Label>Identifier</Label>
                    <Input
                        placeholder={"#localname"}
                        value={autoId}
                        onChange={onIdentifierChange}
                        disabled={!!forceId}
                    />
                </div>
            ) : null}

            <div>
                <Label>Name</Label>
                <Input
                    value={name}
                    placeholder={emptyFolder ? "Folder Name" : "Entity Name"}
                    onChange={onNameChange}
                    autoFocus
                    onKeyDown={onNameInputKeyDown}
                />
            </div>

            <div className="mt-2 flex justify-between">
                <Button variant="secondary" onClick={() => onBackClick()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => localOnCreateClick()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                </Button>
            </div>
        </div>
    )
}
