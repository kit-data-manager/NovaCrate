import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { File } from "lucide-react"
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
 * Form for creating a File data entity. Supports importing a local file or
 * describing a web-based (external) resource.
 */
export function FileEntityForm({
    selectedType,
    onBackClick,
    onCreateClick,
    basePath,
    onUploadFile,
    entityRule
}: {
    selectedType: string | string[]
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    basePath?: string
    onUploadFile(id: string, name: string, file: File): void
    entityRule?: EntityRule
}) {
    const fileService = useFileService()

    const [externalResource, setExternalResource] = useState(false)
    const [path, setPath] = useState("")
    const [name, setName] = useState("")
    const [identifier, setIdentifier] = useState("")
    const [plainFiles, setPlainFiles] = useState<File[]>([])
    const fileUploadRef = useRef<HTMLInputElement>(null)
    const autoId = useAutoId(name)

    const openFilePicker = useCallback(() => {
        fileUploadRef.current?.click()
    }, [])

    const onFileInputChange = useCallback(() => {
        setPlainFiles([...(fileUploadRef.current?.files ?? [])])
    }, [])

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    useEffect(() => {
        if (plainFiles.length > 0) {
            setName((oldName) => (oldName === "" ? plainFiles[0].name : oldName))
        }
    }, [plainFiles])

    const identifierValid = useMemo(() => {
        return !(externalResource && !isValidUrl(identifier))
    }, [externalResource, identifier])

    const submit = useCallback(() => {
        if (!externalResource) {
            onUploadFile(path.replace(/^\.\//, "") + name, name, plainFiles[0])
        } else onCreateClick(identifier || autoId, name)
    }, [autoId, externalResource, identifier, name, onCreateClick, onUploadFile, path, plainFiles])

    const onNameInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") submit()
        },
        [submit]
    )

    const createDisabled = useMemo(() => {
        if (!identifierValid) return true
        if (!externalResource && plainFiles.length === 0) return true
        return autoId.length <= 0
    }, [autoId.length, externalResource, identifierValid, plainFiles.length])

    return (
        <div className="flex flex-col gap-4 min-w-0">
            <CreateEntityHeader
                selectedType={selectedType}
                entityRule={entityRule}
                variant="file"
            />

            {hasAtLeastOneValue(selectedType) && (
                <CreateEntityHint selectedType={pickFirst(selectedType)} />
            )}

            <div>
                <ResourceSourceTabs
                    value={externalResource}
                    onChange={setExternalResource}
                    variant="file"
                />
                {externalResource ? null : (
                    <div className="space-y-4">
                        <Label>Destination</Label>
                        <PathPicker onPathPicked={setPath} defaultPath={basePath} />
                        {fileService === null && (
                            <Error
                                warn
                                title={"File won't be added to RO-Crate"}
                                error={
                                    "The metadata for this file will be created as normal, but it is not possible to add data to this RO-Crate. (No FileService available)"
                                }
                            />
                        )}
                        <Label>File</Label>
                        <div>
                            <Button
                                className="min-w-0 max-w-full truncate"
                                variant="outline"
                                onClick={openFilePicker}
                            >
                                <File className="size-4 mr-2 shrink-0" />
                                <span className="truncate min-w-0">
                                    {plainFiles.length == 0 ? "Select File" : plainFiles[0].name}
                                </span>
                            </Button>
                            <span className="ml-2 text-muted-foreground">
                                {plainFiles.length == 0 ? "" : prettyBytes(plainFiles[0].size)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {(plainFiles.length > 0 || externalResource) && (
                <NameField value={name} onChange={onNameChange} onKeyDown={onNameInputKeyDown} />
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
                data-testid="create-entity-file-upload"
                ref={fileUploadRef}
                onChange={onFileInputChange}
            />
        </div>
    )
}
