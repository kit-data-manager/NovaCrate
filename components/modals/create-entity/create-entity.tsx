import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    ExternalLink,
    File,
    Folder,
    FolderDot,
    Globe,
    HardDrive,
    Plus,
    TriangleAlert
} from "lucide-react"
import { camelCaseReadable, encodeFilePath, fileNameWithoutEnding, isValidUrl } from "@/lib/utils"
import { Error } from "@/components/error"
import prettyBytes from "pretty-bytes"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { useEditorState } from "@/lib/state/editor-state"
import HelpTooltip from "@/components/help-tooltip"
import { useAutoId } from "@/lib/hooks"
import { CreateEntityHint } from "@/components/modals/create-entity/create-entity-hint"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle } from "@/components/ui/alert"

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

            {hasFileUpload ? (
                <div>
                    <Tabs
                        className="mb-4"
                        value={externalResource ? "without-file" : "with-file"}
                        onValueChange={(v) => {
                            setExternalResource(v === "without-file")
                        }}
                    >
                        <TabsList className="flex self-center">
                            <TabsTrigger value="with-file">
                                <HardDrive className="size-4" /> Local File
                            </TabsTrigger>
                            <TabsTrigger value="without-file">
                                <Globe className="size-4" /> Web Resource
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {externalResource ? null : (
                        <>
                            <Label>File</Label>
                            <div>
                                <Button
                                    className="min-w-0 max-w-full truncate"
                                    variant="outline"
                                    onClick={openFilePicker}
                                >
                                    <File className="size-4 mr-2 shrink-0" />
                                    <span className="truncate min-w-0">
                                        {plainFiles.length == 0
                                            ? "Select File"
                                            : plainFiles[0].name}
                                    </span>
                                </Button>
                                <span className="ml-2 text-muted-foreground">
                                    {plainFiles.length == 0 ? "" : prettyBytes(plainFiles[0].size)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            ) : null}

            {hasFolderUpload ? (
                <div>
                    <Tabs
                        className="mb-4"
                        value={externalResource ? "without-file" : "with-file"}
                        onValueChange={(v) => {
                            setExternalResource(v === "without-file")
                        }}
                    >
                        <TabsList className="flex self-center">
                            <TabsTrigger value="with-file">
                                <HardDrive className="size-4" /> Local Folder
                            </TabsTrigger>
                            <TabsTrigger value="without-file">
                                <Globe className="size-4" /> Web Resource
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {externalResource ? null : (
                        <>
                            <Label>Folder</Label>
                            <div className="flex items-center">
                                {!emptyFolder ? (
                                    <Button
                                        className="min-w-0 max-w-full truncate shrink"
                                        variant="outline"
                                        onClick={openFolderPicker}
                                    >
                                        <Folder className="size-4 mr-2" />
                                        <span className={"truncate min-w-0"}>
                                            {folderFiles.length == 0
                                                ? "Select Folder"
                                                : folderFiles[0].webkitRelativePath.split("/")[0]}
                                        </span>
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
                                        <FolderDot className="size-4 mr-2" />
                                        Empty Folder
                                    </Button>
                                )}
                                <span className="ml-2 text-muted-foreground">
                                    {folderFiles.length == 0
                                        ? ""
                                        : `${folderFiles.length} files (${prettyBytes(folderFiles.map((f) => f.size).reduce((a, b) => a + b))} total)`}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            ) : null}

            {(hasFileUpload || hasFolderUpload) && !forceId && !externalResource ? (
                <div>
                    <Label className="flex gap-1 items-center py-1">
                        Path{" "}
                        <HelpTooltip>
                            The path where the file(s) will be located in the Crate. To upload to a
                            different path, use the File Explorer for more convenience.
                        </HelpTooltip>
                    </Label>
                    <Input value={path} onChange={(e) => setPath(e.target.value)} />
                </div>
            ) : null}

            <div>
                <Label>Name</Label>
                <Input
                    value={name}
                    placeholder={emptyFolder ? "Folder Name" : "Entity Name"}
                    onChange={onNameChange}
                    onKeyDown={onNameInputKeyDown}
                />
            </div>

            {(!hasFileUpload || externalResource) &&
            (!hasFolderUpload || externalResource) &&
            !forceId ? (
                <div>
                    <Label>Identifier</Label>
                    <Input
                        placeholder={
                            autoId ||
                            (externalResource ? "https://..." : "#localname or https://...")
                        }
                        value={identifier}
                        onChange={onIdentifierChange}
                    />
                    <a
                        href={
                            hasFileUpload || hasFolderUpload
                                ? "https://www.researchobject.org/ro-crate/specification/1.1/data-entities.html"
                                : "https://www.researchobject.org/ro-crate/specification/1.1/contextual-entities.html#identifiers-for-contextual-entities"
                        }
                        target="_blank"
                        className="text-sm inline-flex pt-1 text-muted-foreground hover:underline"
                    >
                        How to find a good identifier <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                </div>
            ) : null}

            {externalResource && !identifierValid && identifier.length > 0 ? (
                <Alert className="text-warn border-warn/40">
                    <TriangleAlert />
                    <AlertTitle>Identifier must be a valid absolute URL</AlertTitle>
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
