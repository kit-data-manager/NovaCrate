import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useAutoId } from "@/components/use-auto-id"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, File, Folder, Plus } from "lucide-react"
import { useFilePicker } from "use-file-picker"
import { fileNameWithoutEnding } from "@/lib/utils"
import { Error } from "@/components/error"
import prettyBytes from "pretty-bytes"

// TODO data entities

export function CreateEntity({
    onBackClick,
    onCreateClick,
    defaultName,
    forceId,
    fileUpload,
    folderUpload
}: {
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    defaultName?: string
    forceId?: string
    fileUpload?: boolean
    folderUpload?: boolean
}) {
    const [name, setName] = useState(defaultName || "")
    const [identifier, setIdentifier] = useState<null | string>(null)
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

    const localOnCreateClick = useCallback(() => {
        onCreateClick(autoId, name)
    }, [autoId, name, onCreateClick])

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

    const hasFileUpload = useMemo(() => {
        return fileUpload && !forceId
    }, [fileUpload, forceId])

    const hasFolderUpload = useMemo(() => {
        return folderUpload && !forceId
    }, [folderUpload, forceId])

    if (hasFileUpload && hasFolderUpload)
        return (
            <Error error="Cannot determine whether this is a file upload or a folder upload. Make sure your context is not ambiguous." />
        )

    return (
        <div className="flex flex-col gap-4">
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
                    <div>
                        <Button variant="outline" onClick={openFolderPicker}>
                            <Folder className="w-4 h-4 mr-2" />
                            {folderFiles.length == 0
                                ? "Select Folder"
                                : folderFiles[0].webkitRelativePath.split("/")[0]}
                        </Button>
                        <span className="ml-2 text-muted-foreground">
                            {folderFiles.length == 0
                                ? ""
                                : `${folderFiles.length} files (${prettyBytes(folderFiles.map((f) => f.size).reduce((a, b) => a + b))} total)`}
                        </span>
                    </div>
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
                    placeholder={"Entity Name"}
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
