import { useCallback } from "react"
import { toast } from "sonner"
import { useCore } from "@/components/providers/core-provider"
import { operationState } from "@/lib/state/operation-state"
import { editorState } from "@/lib/state/editor-state"
import { EntityIcon } from "@/components/entity/entity-icon"
import { getEntityDisplayName } from "@/lib/utils"
import React from "react"

/**
 * Pre-wrapped crate mutation methods that handle `isSaving`, `saveErrors`,
 * and toast notifications internally. Drop-in replacement for the legacy
 * `CrateDataContext` mutation API.
 *
 * Every method returns `boolean` (`true` = success, `false` = failure) and
 * never throws — exceptions are caught and recorded in {@link operationState}.
 *
 * Components that need custom behavior beyond these methods (e.g. their own
 * loading state or progress tracking) can use `useCore()` directly alongside
 * this hook.
 */
export function useCrateMutations() {
    const core = useCore()

    const saveEntity = useCallback(
        async (_entity: IEntity): Promise<boolean> => {
            // Copy the entity as it might come from the editor state and would be frozen
            const entity = JSON.parse(JSON.stringify(_entity)) as IEntity

            const { setIsSaving, addSaveError, clearSaveError } = operationState.getState()
            setIsSaving(true)
            try {
                const isNew = !editorState.getState().initialEntities.has(entity["@id"])
                if (isNew) {
                    await core.getMetadataService().addEntity(entity, true)
                } else {
                    await core.getMetadataService().updateEntity(entity)
                }

                clearSaveError(entity["@id"])

                toast(
                    React.createElement(
                        "div",
                        { className: "flex items-center" },
                        React.createElement(EntityIcon, { entity }),
                        " ",
                        getEntityDisplayName(entity),
                        " saved"
                    ),
                    { duration: 2000 }
                )

                return true
            } catch (e) {
                console.error("Error occurred while trying to save entity", e)
                addSaveError(entity["@id"], e)
                toast.warning(
                    React.createElement(
                        "div",
                        null,
                        " Could not save changes to ",
                        React.createElement(EntityIcon, { entity, className: "mr-1" }),
                        getEntityDisplayName(entity)
                    )
                )
                return false
            } finally {
                setIsSaving(false)
            }
        },
        [core]
    )

    const deleteEntity = useCallback(
        async (_entity: IEntity, deleteData: boolean): Promise<boolean> => {
            // Copy the entity as it might come from the editor state and would be frozen
            const entity = JSON.parse(JSON.stringify(_entity)) as IEntity

            const { addSaveError } = operationState.getState()
            try {
                await core.deleteEntity(entity["@id"], deleteData)
                return true
            } catch (e) {
                console.error("Error occurred while trying to delete entity", e)
                addSaveError(entity["@id"], e)
                return false
            }
        },
        [core]
    )

    const changeEntityId = useCallback(
        async (_entity: IEntity, newEntityId: string): Promise<boolean> => {
            // Copy the entity as it might come from the editor state and would be frozen
            const entity = JSON.parse(JSON.stringify(_entity)) as IEntity

            const { addSaveError } = operationState.getState()
            try {
                await core.changeEntityIdentifier(entity["@id"], newEntityId)
                return true
            } catch (e) {
                console.error("Error occurred while trying to rename entity", e)
                addSaveError(entity["@id"], e)
                return false
            }
        },
        [core]
    )

    const createFileEntity = useCallback(
        async (_entity: IEntity, file: File, overwrite = false): Promise<boolean> => {
            // Copy the entity as it might come from the editor state and would be frozen
            const entity = JSON.parse(JSON.stringify(_entity)) as IEntity

            const { setIsSaving, addSaveError } = operationState.getState()
            setIsSaving(true)
            try {
                await core.addFileEntity(entity.name as string, entity["@id"], file, overwrite)
                return true
            } catch (e) {
                console.error("Error occurred while trying to create file entity", e)
                addSaveError(entity["@id"], e)
                return false
            } finally {
                setIsSaving(false)
            }
        },
        [core]
    )

    const createFolderEntity = useCallback(
        async (
            _entity: IEntity,
            files: IEntityWithFile[],
            progressCallback?: (current: number, max: number, errors: unknown[]) => void
        ): Promise<boolean> => {
            // Copy the entity as it might come from the editor state and would be frozen
            const entity = JSON.parse(JSON.stringify(_entity)) as IEntity

            const { setIsSaving, addSaveError } = operationState.getState()
            setIsSaving(true)
            try {
                await core.addFolderEntity(entity.name as string, entity["@id"])

                const errors: unknown[] = []
                let progress = 0

                for (const file of files) {
                    try {
                        await core.addFileEntity(
                            file.entity.name as string,
                            file.entity["@id"],
                            file.file
                        )
                        if (progressCallback) progressCallback(progress++, files.length, errors)
                    } catch (e) {
                        errors.push(e)
                        if (progressCallback) progressCallback(progress++, files.length, errors)
                    }
                }

                return true
            } catch (e) {
                console.error("Error occurred while trying to create folder entity", e)
                addSaveError(entity["@id"], e)
                return false
            } finally {
                setIsSaving(false)
            }
        },
        [core]
    )

    const saveAllEntities = useCallback(
        async (entities: IEntity[]): Promise<void> => {
            const { setIsSaving, addSaveError, clearSaveError } = operationState.getState()
            setIsSaving(true)
            try {
                const initialEntities = editorState.getState().initialEntities
                for (const _entity of entities) {
                    // Copy the entity as it might come from the editor state and would be frozen
                    const entity = JSON.parse(JSON.stringify(_entity)) as IEntity

                    try {
                        const isNew = !initialEntities.has(entity["@id"])
                        if (isNew) {
                            await core.getMetadataService().addEntity(entity, true)
                        } else {
                            await core.getMetadataService().updateEntity(entity)
                        }
                        clearSaveError(entity["@id"])
                    } catch (e) {
                        console.error("Error saving entity", entity["@id"], e)
                        addSaveError(entity["@id"], e)
                    }
                }
            } finally {
                setIsSaving(false)
            }
        },
        [core]
    )

    return {
        saveEntity,
        deleteEntity,
        changeEntityId,
        createFileEntity,
        createFolderEntity,
        saveAllEntities
    }
}
