import { useCallback, useState } from "react"
import { useCrateMutations } from "@/lib/hooks/use-crate-mutations"
import { useContextResolver } from "@/lib/hooks/hooks"
import { asValidPath } from "@/lib/utils"
import { RO_CRATE_FILE } from "@/lib/constants"
import { IContextResolverService } from "@/lib/core/IContextResolverService"

/**
 * Owns the upload-progress state and the file/folder upload handlers used by the
 * {@link CreateEntityModal}. Extracting this keeps the modal orchestrator free of
 * the granular progress state and the (relatively long) upload callback bodies.
 */
export function useCreateEntityUpload({
    selectedType,
    openTab,
    onClose
}: {
    selectedType: string | string[]
    openTab: (tab: { entityId: string }, focus?: boolean) => void
    onClose: () => void
}) {
    const { createFileEntity, createFolderEntity } = useCrateMutations()
    const resolver: IContextResolverService = useContextResolver()

    const [uploading, setUploading] = useState(false)
    const [currentUploadProgress, setCurrentUploadProgress] = useState(0)
    const [maxUploadProgress, setMaxUploadProgress] = useState(0)
    const [uploadErrors, setUploadErrors] = useState<unknown[]>([])

    const resetUploadState = useCallback(() => {
        setUploading(false)
        setCurrentUploadProgress(0)
        setMaxUploadProgress(0)
        setUploadErrors([])
    }, [])

    const onUploadFile = useCallback(
        async (id: string, name: string, file: File) => {
            setUploading(true)
            setMaxUploadProgress(1)
            try {
                const result = await createFileEntity(
                    {
                        "@id": id,
                        "@type": selectedType,
                        name
                    },
                    file
                )
                if (!result) setUploadErrors(["File upload failed"])
                else {
                    setCurrentUploadProgress(1)
                    openTab({ entityId: id }, true)
                    onClose()
                }
            } catch (e) {
                setUploadErrors([e])
            }
        },
        [createFileEntity, onClose, openTab, selectedType]
    )

    const onUploadFolder = useCallback(
        async (id: string, name: string, files: File[]) => {
            setUploading(true)
            setMaxUploadProgress(files.length > 0 ? files.length : 1)
            const folderPath = asValidPath(id, true)
            try {
                const result = await createFolderEntity(
                    {
                        "@id": folderPath,
                        "@type": selectedType,
                        name
                    },
                    files.map((file) => {
                        return {
                            entity: {
                                "@id":
                                    folderPath +
                                    file.webkitRelativePath.split("/").slice(1).join("/"),
                                "@type": resolver.reverse(RO_CRATE_FILE) || RO_CRATE_FILE,
                                name: file.name
                            },
                            file
                        }
                    }),
                    (current: number, max: number, errors: unknown[]) => {
                        setCurrentUploadProgress(current)
                        setMaxUploadProgress(max)
                        setUploadErrors(errors)
                    }
                )
                if (!result) setUploadErrors(["Folder upload failed"])
                else {
                    setCurrentUploadProgress(files.length > 0 ? files.length : 1)
                    openTab({ entityId: folderPath }, true)
                    onClose()
                }
            } catch (e) {
                setUploadErrors([e])
            }
        },
        [createFolderEntity, onClose, openTab, resolver, selectedType]
    )

    return {
        uploading,
        currentUploadProgress,
        maxUploadProgress,
        uploadErrors,
        resetUploadState,
        onUploadFile,
        onUploadFolder
    }
}
