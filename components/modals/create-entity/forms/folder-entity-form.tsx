import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Folder, FolderDot } from "lucide-react"
import prettyBytes from "pretty-bytes"
import { Error } from "@/components/error"
import { PathPicker } from "@/components/file-explorer/path-picker"
import { useFileService } from "@/lib/hooks/use-persistence"
import { useAutoId } from "@/lib/hooks/hooks"
import { hasAtLeastOneValue, isValidUrl, pickFirst } from "@/lib/utils"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { CreateEntityHint } from "@/components/modals/create-entity/create-entity-hint"
import {
    ActionBar,
    CreateEntityHeader,
    IdentifierField,
    NameField,
    ResourceSourceTabs,
    UrlInvalidAlert
} from "@/components/modals/create-entity/form-fields"

/**
 * Form for creating a Dataset (folder) data entity. Supports importing a local
 * folder (with contained files), creating an empty folder, or describing a
 * web-based (external) resource.
 */
export function FolderEntityForm({
    selectedType,
    onBackClick,
    onCreateClick,
    basePath,
    onUploadFolder,
    entityRule
}: {
    selectedType: string | string[]
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    basePath?: string
    onUploadFolder(id: string, name: string, files: File[]): void
    entityRule?: EntityRule
}) {
    const fileService = useFileService()

    const [externalResource, setExternalResource] = useState(false)
    const [path, setPath] = useState("")
    const [name, setName] = useState("")
    const [identifier, setIdentifier] = useState("")
    const [emptyFolder, setEmptyFolder] = useState(false)
    const [folderFiles, setFolderFiles] = useState<File[]>([])
    const folderUploadRef = useRef<HTMLInputElement>(null)
    const autoId = useAutoId(name)

    const openFolderPicker = useCallback(() => {
        if (folderUploadRef.current) {
            folderUploadRef.current.setAttribute("webkitdirectory", "")
            folderUploadRef.current.click()
        }
    }, [])

    const onFolderInputChange = useCallback(() => {
        setFolderFiles([...(folderUploadRef.current?.files ?? [])])
    }, [])

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    useEffect(() => {
        if (folderFiles.length > 0) {
            setName((oldName) =>
                oldName === "" ? folderFiles[0].webkitRelativePath.split("/")[0] : oldName
            )
        }
    }, [folderFiles])

    const baseFileName = useMemo(() => {
        return folderFiles.length > 0 ? folderFiles[0].webkitRelativePath.split("/")[0] : undefined
    }, [folderFiles])

    const identifierValid = useMemo(() => {
        return !(externalResource && !isValidUrl(identifier))
    }, [externalResource, identifier])

    const submit = useCallback(() => {
        if (!externalResource) {
            onUploadFolder(path.replace(/^\.\//, "") + name, name, emptyFolder ? [] : folderFiles)
        } else onCreateClick(identifier || autoId, name)
    }, [
        autoId,
        emptyFolder,
        externalResource,
        folderFiles,
        identifier,
        name,
        onCreateClick,
        onUploadFolder,
        path
    ])

    const onNameInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") submit()
        },
        [submit]
    )

    const createDisabled = useMemo(() => {
        if (!identifierValid) return true
        if (!externalResource && !emptyFolder && folderFiles.length === 0) return true
        return autoId.length <= 0
    }, [autoId.length, emptyFolder, externalResource, folderFiles.length, identifierValid])

    return (
        <div className="flex flex-col gap-4 min-w-0">
            <CreateEntityHeader
                selectedType={selectedType}
                entityRule={entityRule}
                variant="folder"
            />

            {hasAtLeastOneValue(selectedType) && (
                <CreateEntityHint selectedType={pickFirst(selectedType)} />
            )}

            <div>
                <ResourceSourceTabs
                    value={externalResource}
                    onChange={setExternalResource}
                    variant="folder"
                />
                {externalResource ? null : (
                    <div className="space-y-4">
                        <Label>Destination</Label>
                        <PathPicker onPathPicked={setPath} defaultPath={basePath} />
                        {fileService === null && (
                            <Error
                                warn
                                title={"Files won't be added to RO-Crate"}
                                error={
                                    "The metadata for the selected folder will be created as normal, but it is not possible to add data to this RO-Crate. (No FileService available)"
                                }
                            />
                        )}
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
                    </div>
                )}
            </div>

            {(folderFiles.length > 0 || emptyFolder || externalResource) && (
                <NameField
                    value={name}
                    onChange={onNameChange}
                    onKeyDown={onNameInputKeyDown}
                    placeholder={emptyFolder ? "Folder Name" : "Entity Name"}
                />
            )}

            {externalResource && (
                <IdentifierField
                    value={identifier}
                    onChange={onIdentifierChange}
                    externalResource={externalResource}
                    autoId={autoId}
                />
            )}

            <UrlInvalidAlert show={externalResource && !identifierValid && identifier.length > 0} />

            <ActionBar onBack={onBackClick} onCreate={submit} createDisabled={createDisabled} />

            <input
                type="file"
                className="hidden"
                data-testid="create-entity-folder-upload"
                ref={folderUploadRef}
                onChange={onFolderInputChange}
            />
        </div>
    )
}
