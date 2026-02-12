import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, TriangleAlert } from "lucide-react"
import { camelCaseReadable, encodeFilePath, fileNameWithoutEnding, isValidUrl } from "@/lib/utils"
import { Error } from "@/components/error"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { useEditorState } from "@/lib/state/editor-state"
import HelpTooltip from "@/components/help-tooltip"
import { useAutoId } from "@/lib/hooks"
import { CreateEntityHint } from "@/components/modals/create-entity/create-entity-hint"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUpload } from "@/components/modals/create-entity/file-upload"
import { FolderUpload } from "@/components/modals/create-entity/folder-upload"

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
    const context = useEditorState((store) => store.crateContext)

    const [externalResource, setExternalResource] = useState(false)
    const [path, setPath] = useState("")
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
    const [identifier, setIdentifier] = useState<string>("")
    const [emptyFolder, setEmptyFolder] = useState(false)
    const createEntityFileUploadRef = useRef<HTMLInputElement>(null)
    const createEntityFolderUploadRef = useRef<HTMLInputElement>(null)

    const [plainFiles, setPlainFiles] = useState<File[]>([])
    const [folderFiles, setFolderFiles] = useState<File[]>([])

    const openFilePicker = useCallback(() => {
        if (createEntityFileUploadRef.current) {
            createEntityFileUploadRef.current.click()
        }
    }, [])

    const openFolderPicker = useCallback(() => {
        if (createEntityFolderUploadRef.current) {
            createEntityFolderUploadRef.current.setAttribute("webkitdirectory", "")
            createEntityFolderUploadRef.current.click()
        }
    }, [])

    const onFileInputChange = useCallback(() => {
        setPlainFiles([...(createEntityFileUploadRef.current?.files ?? [])])
    }, [])

    const onFolderInputChange = useCallback(() => {
        setFolderFiles([...(createEntityFolderUploadRef.current?.files ?? [])])
    }, [])

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    const autoId = useAutoId(name)

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

    useEffect(() => {
        setPath((currentPath) => {
            if (emptyFolder) {
                return (basePath || "") + (encodeFilePath(name.replaceAll("/", "")) || "")
            } else return currentPath
        })
    }, [basePath, emptyFolder, name])

    useEffect(() => {
        setPath((currentPath) => {
            if (!emptyFolder) {
                return (basePath || "") + encodeFilePath(baseFileName || "")
            } else return currentPath
        })
    }, [baseFileName, basePath, emptyFolder])

    const localOnCreateClick = useCallback(() => {
        if (
            !forceId &&
            ((hasFileUpload && !externalResource) || (hasFolderUpload && !externalResource))
        ) {
            if (hasFileUpload) {
                onUploadFile(path, name, plainFiles[0])
            } else {
                onUploadFolder(path, name, emptyFolder ? [] : folderFiles)
            }
        } else onCreateClick(forceId || identifier || autoId, name)
    }, [
        forceId,
        hasFileUpload,
        externalResource,
        hasFolderUpload,
        onCreateClick,
        identifier,
        autoId,
        name,
        onUploadFile,
        path,
        plainFiles,
        onUploadFolder,
        emptyFolder,
        folderFiles
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

    const identifierValid = useMemo(() => {
        return !(externalResource && !isValidUrl(identifier))
    }, [externalResource, identifier])

    const createDisabled = useMemo(() => {
        if (!identifierValid) return true
        if (hasFolderUpload && !externalResource && !emptyFolder && folderFiles.length === 0)
            return true
        if (hasFileUpload && !externalResource && plainFiles.length === 0) return true
        return autoId.length <= 0
    }, [
        autoId.length,
        emptyFolder,
        externalResource,
        folderFiles.length,
        hasFileUpload,
        hasFolderUpload,
        identifierValid,
        plainFiles.length
    ])

    if (hasFileUpload && hasFolderUpload)
        return (
            <Error error="Cannot determine whether this is a file upload or a folder upload. Make sure your context is not ambiguous." />
        )

    return (
        <div className="flex flex-col gap-4 min-w-0">
            <DialogHeader>
                <DialogTitle>Create a new {camelCaseReadable(selectedType)} Entity</DialogTitle>

                <DialogDescription>
                    {!hasFileUpload && !hasFolderUpload ? (
                        <>
                            Enter a name for the entity.{" "}
                            {forceId
                                ? ""
                                : `An ID will be generated.
                            You can also change the ID.`}{" "}
                            Press Create to start adding Properties.
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
                            Add a folder to the Crate. If you want to create an empty folder, select
                            Empty Folder and enter a name of your choice. Otherwise, the folder and
                            all contained files and folders will be uploaded.
                        </>
                    ) : null}
                </DialogDescription>
            </DialogHeader>

            <CreateEntityHint selectedType={selectedType} />

            {hasFileUpload && (
                <FileUpload
                    externalResource={externalResource}
                    onValueChange={(v) => {
                        setExternalResource(v === "without-file")
                    }}
                    onClick={openFilePicker}
                    files={plainFiles}
                />
            )}

            {hasFolderUpload && (
                <FolderUpload
                    externalResource={externalResource}
                    onValueChange={(v) => {
                        setExternalResource(v === "without-file")
                    }}
                    emptyFolder={emptyFolder}
                    onClickSelectFolder={openFolderPicker}
                    files={folderFiles}
                    baseFileName={baseFileName}
                    onClickEmptyFolder={() => setEmptyFolder((v) => !v)}
                />
            )}

            {/* Only show the path field if either
                  1. This is a file upload and there is a file selected
                  2. This is a folder upload and either...
                      2a. there are files selected
                      2b. the user wants to create an empty folder
                AND
                  The ID is not being forced (this would also force the path)
                AND
                  This is not an external resource (external resources have no file path in the crate)
            */}
            {((hasFileUpload && plainFiles.length > 0) ||
                (hasFolderUpload && (folderFiles.length > 0 || emptyFolder))) &&
            !forceId &&
            !externalResource ? (
                <div>
                    <Label>
                        Path
                        <HelpTooltip>
                            The path where the file(s) will be located in the Crate. To upload to a
                            different path, use the File Explorer for more convenience.
                        </HelpTooltip>
                    </Label>
                    <Input
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder={"/"}
                    />
                </div>
            ) : null}

            {/* Only show the name field if either
                  1. This is neither a file upload nor a folder upload (contextual entity creation)
                  2. This is a web-based data entity (name can't be inferred)
                  2. This is a file upload and there is a file selected
                  3. This is a folder upload and either...
                     3a. there are files selected
                     3b. the user wants to create an empty folder
               Because the name field is filled automatically when a folder or file is uploaded, we hide the field beforehand to reduce the visual complexity.
            */}
            {((!hasFileUpload && !hasFolderUpload) ||
                (hasFileUpload && plainFiles.length > 0) ||
                (hasFolderUpload && (folderFiles.length > 0 || emptyFolder)) ||
                externalResource) && (
                <div>
                    <Label>
                        Name
                        <HelpTooltip>
                            Give the entity a human-readable name that tells other humans what this
                            entity describes
                        </HelpTooltip>
                    </Label>
                    <Input
                        value={name}
                        placeholder={emptyFolder ? "Folder Name" : "Entity Name"}
                        onChange={onNameChange}
                        onKeyDown={onNameInputKeyDown}
                    />
                </div>
            )}

            {(!hasFileUpload || externalResource) &&
            (!hasFolderUpload || externalResource) &&
            !forceId ? (
                <div>
                    <Label>
                        {externalResource ? "URL" : "Identifier"}
                        <HelpTooltip>
                            The identifier must be unique and persistent. Consider using a PID such
                            as a DOI as the identifier. In most cases, a locally unique ID is
                            automatically generated for you.
                        </HelpTooltip>
                    </Label>
                    <Input
                        placeholder={
                            externalResource
                                ? "https://..."
                                : autoId || "Unique and persistent identifier"
                        }
                        value={identifier}
                        onChange={onIdentifierChange}
                    />
                </div>
            ) : null}

            {externalResource && !identifierValid && identifier.length > 0 ? (
                <Alert className="text-warn border-warn/40">
                    <TriangleAlert />
                    <AlertTitle>The provided URL is invalid.</AlertTitle>
                    <AlertDescription>
                        Make sure the URL is properly formatted, including the protocol. Example:
                        https://doi.org/example.pid
                    </AlertDescription>
                </Alert>
            ) : null}

            <div className="mt-2 flex justify-between">
                <Button variant="secondary" onClick={() => onBackClick()}>
                    <ArrowLeft className="size-4 mr-2" /> Back
                </Button>
                <Button onClick={() => localOnCreateClick()} disabled={createDisabled}>
                    <Plus className="size-4 mr-2" />
                    Create
                </Button>
            </div>

            <input
                type="file"
                className="hidden"
                data-testid="create-entity-file-upload"
                ref={createEntityFileUploadRef}
                onChange={onFileInputChange}
            />

            <input
                type="file"
                className="hidden"
                data-testid="create-entity-folder-upload"
                ref={createEntityFolderUploadRef}
                onChange={onFolderInputChange}
            />
        </div>
    )
}
