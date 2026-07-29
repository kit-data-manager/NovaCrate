import { useMemo } from "react"
import { Error } from "@/components/error"
import { useContextResolver } from "@/lib/hooks/hooks"
import { toArray } from "@/lib/utils"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { ContextualEntityForm } from "@/components/modals/create-entity/forms/contextual-entity-form"
import { FileEntityForm } from "@/components/modals/create-entity/forms/file-entity-form"
import { FolderEntityForm } from "@/components/modals/create-entity/forms/folder-entity-form"

/**
 * Top-level create-entity stage. Decides which form to render based on the
 * resolved entity type (File, Dataset, or contextual) and whether an id is
 * forced. When an id is forced, file/folder uploads are skipped and the
 * contextual form is used (so the data entity is created from metadata only).
 */
export function CreateEntity({
    selectedType,
    onBackClick,
    onCreateClick,
    forceId,
    basePath,
    onUploadFile,
    onUploadFolder,
    entityRule
}: {
    selectedType: string | string[]
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    forceId?: string
    basePath?: string
    onUploadFile(id: string, name: string, file: File): void
    onUploadFolder(id: string, name: string, files: File[]): void
    entityRule?: EntityRule
}) {
    const resolver = useContextResolver()

    const fileUpload = useMemo(() => {
        return toArray(selectedType).some((type) => resolver.resolve(type) === RO_CRATE_FILE)
    }, [resolver, selectedType])

    const folderUpload = useMemo(() => {
        return toArray(selectedType).some((type) => resolver.resolve(type) === RO_CRATE_DATASET)
    }, [resolver, selectedType])

    const hasFileUpload = fileUpload && !forceId
    const hasFolderUpload = folderUpload && !forceId

    if (hasFileUpload && hasFolderUpload)
        return (
            <Error error="Cannot determine whether this is a file upload or a folder upload. Make sure your context is not ambiguous." />
        )

    const defaultName =
        (fileUpload || folderUpload) && forceId
            ? forceId.split("/").filter((part) => !!part).pop()
            : undefined

    if (hasFileUpload)
        return (
            <FileEntityForm
                selectedType={selectedType}
                onBackClick={onBackClick}
                onCreateClick={onCreateClick}
                basePath={basePath}
                onUploadFile={onUploadFile}
                entityRule={entityRule}
            />
        )

    if (hasFolderUpload)
        return (
            <FolderEntityForm
                selectedType={selectedType}
                onBackClick={onBackClick}
                onCreateClick={onCreateClick}
                basePath={basePath}
                onUploadFolder={onUploadFolder}
                entityRule={entityRule}
            />
        )

    return (
        <ContextualEntityForm
            selectedType={selectedType}
            onBackClick={onBackClick}
            onCreateClick={onCreateClick}
            forceId={forceId}
            entityRule={entityRule}
            defaultName={defaultName}
        />
    )
}
