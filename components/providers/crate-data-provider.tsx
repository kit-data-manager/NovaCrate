"use client"

import {
    createContext,
    PropsWithChildren,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"
import useSWR from "swr"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import { Draft, produce } from "immer"
import { applyServerDifferences } from "@/lib/ensure-sync"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { changeEntityId, getEntityDisplayName } from "@/lib/utils"
import { EntityIcon } from "@/components/entity/entity-icon"
import { useInterval } from "usehooks-ts"

const CRATE_ID_STORAGE_KEY = "crate-id"

export interface ICrateDataProvider {
    /**
     * Implementation of the CrateServiceAdapter interface.
     */
    readonly serviceProvider?: CrateService
    /**
     * Id of the currently opened crate.
     */
    crateId?: string

    /**
     * Change the currently opened crate.
     * @param crateId Id of the crate to be opened.
     */
    setCrateId(crateId: string): void
    /**
     * Unsets the crateId. This will result in a redirect to the main menu. This function should be called
     * when the current crate should be "closed".
     */
    unsetCrateId(): void
    /**
     * Local copy of the crate state.
     */
    crateData?: ICrate
    /**
     * True while the crate state is still being fetched from the backend.
     */
    crateDataIsLoading: boolean
    /**
     * Saves or creates an entity based on its content. It is automatically determined whether the entity has to be created or updated.
     * @param entity The entity to be saved or created.
     * @returns {boolean} Whether the operation was successful. When the operation is not successful returns false and updates the saveError map. Also directly toasts a success or failure message to the interface.
     */
    saveEntity(entity: IEntity): Promise<boolean>
    /**
     * Calls saveEntity for each entity in the given entities array.
     */
    saveAllEntities(entities: IEntity[]): Promise<void>
    /**
     * Creates an entity based on the passed file. Will not optimistically update the local crate state. Calls serviceProvider.createFileEntity template method. The passed file will be forwarded to the CrateServiceAdapter implementation, so its contents can be uploaded to a remote backend.
     * @param entity The user can define name and @id of the file entity beforehand, which are given through this entity object.
     * @param file The file to be uploaded to the backend.
     * @param overwrite Whether to overwrite the file if it already exists. Defaults to false.
     * @returns {Promise<boolean>} Whether the operation was successful.
     */
    createFileEntity(entity: IEntity, file: File, overwrite?: boolean): Promise<boolean>
    /**
     * Creates one or more entities based on the passed folder. Will optimistically update the local crate state in case of entities for folders, as there is no method in the CrateServiceAdapter interface to do so. Calls serviceProvider.createFileEntity template method.
     * @param entity The user can define name and @id of the folder entity beforehand, which are given through this entity object.
     * @param files The files to be uploaded to the backend.
     * @param progressCallback Optional callback that is called with the current progress on file upload to the backend
     * @returns {Promise<boolean>} Whether the operation was successful.
     */
    createFolderEntity(
        entity: IEntity,
        files: IEntityWithFile[],
        progressCallback?: (current: number, max: number, errors: unknown[]) => void
    ): Promise<boolean>
    /**
     * Delete an entity. Will optimistically update the local crate state.
     * @param entity While an IEntity object is expected, only @id and @type have to be provided. Other properties can be omitted.
     * @returns {Promise<boolean>} Whether the operation was successful.
     */
    deleteEntity(entity: IEntity): Promise<boolean>
    /**
     * Changes the @id of the passed crate to the given newEntityId. Optimistically updates the local crate state. The serviceProvider is responsible for updating
     * all incoming references to the entity.
     * @param entityData The entity to be renamed.
     * @param newEntityId The new @id of the entity.
     * @returns {Promise<boolean>} Whether the operation was successful.
     */
    renameEntity(entityData: IEntity, newEntityId: string): Promise<boolean>
    /**
     * Adds a key-value pair to the custom @context of the crate. The key and value are strings. The key must be unique within the crate.
     */
    addCustomContextPair(key: string, value: string): Promise<void>
    /**
     * Removes a key-value pair from the custom @context of the crate. The key must be unique within the crate.
     */
    removeCustomContextPair(key: string): Promise<void>
    /**
     * Directly overwrites the ro-crate-metadata.json file with the passed JSON string. This should result in the entire remote crate state to be overwritten.
     * Local crate state is not optimistically updated.
     */
    saveRoCrateMetadataJSON(json: string): Promise<void>
    reload(): void
    /**
     * True while waiting for the remote to respond to an update operation.
     */
    isSaving: boolean
    /**
     * Map of entity ids to the most recent error encountered while updating the entity.
     */
    saveError: Map<string, unknown>
    /**
     * Removes the save error for the given entity id, or all entities, from the saveError map.
     */
    clearSaveError(id?: string): void

    /**
     * Error that occurred while trying to fetch the remote crate state. Undefined if no error was encountered.
     */
    error: unknown
    /**
     * Error that occurred during the last health test. Undefined if no error was encountered. If the last health test failed, it can be assumed that the backend is unavailable.
     */
    healthTestError: unknown
}

/**
 * The CrateDataContext is the gateway between the local editor state and the CrateServiceAdapter interface, which acts as an interface to the backend editor state. The backend can either be hosted
 * remotely (e.g. REST API) or locally (in-browser). The CrateServiceAdapter implementation is responsible for the interaction with the backend.
 *
 * This context is provided through the {@link CrateDataProvider} component, which contains some more documentation on the inner workings and purpose of this gateway.
 *
 * The backend may sometimes be referred to as the remote, even though it might be locally implemented.
 */
export const CrateDataContext = createContext<ICrateDataProvider>({
    serviceProvider: undefined,
    crateId: undefined,
    saveEntity: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    saveAllEntities: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    deleteEntity: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    renameEntity: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    createFileEntity(): Promise<boolean> {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    createFolderEntity(): Promise<boolean> {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    addCustomContextPair() {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    removeCustomContextPair() {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    saveRoCrateMetadataJSON() {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    reload: () => {
        console.warn("Crate Data Provider not mounted yet")
    },
    crateDataIsLoading: false,
    isSaving: false,
    saveError: new Map(),
    clearSaveError() {
        throw "Crate Data Provider not mounted yet"
    },
    error: undefined,
    healthTestError: undefined,
    setCrateId() {
        throw "Crate Data Provider not mounted yet"
    },
    unsetCrateId() {
        console.warn("Crate Data Provider not mounted yet")
    }
})

/**
 * The CrateDataProvider is a context provider that is responsible for the interaction with the NovaCrate backend (`serviceProvider` prop).
 * This provider can work with any backend (`serviceProvider`) that implements the CrateServiceAdapter interface. Note that the backend can either
 * be accessed remotely (e.g. REST API) or locally (in-browser), as this is completely up to the CrateServiceAdapter implementation.
 *
 * The CrateDataProvider is a large assortment of template methods, corresponding to the methods of the CrateServiceAdapter interface. The template methods
 * are filled in from the serviceProvider prop. It is mainly responsible for the following things:
 *  1. Maintaining a local copy of the crate state (whose original is stored in the backend) and updating it optimistically whenever a change is triggered. This is done to hide network latency and heavy backend operations.
 *  2. Merging the remote crate state with the local copy of the crate state as well as the editor state.
 *  3. In case of a conflict between the local copy of the crate state and the remote crate state, the local state and the editor state are discarded and overwritten by the remote state in all places necessary.
 *
 *  Note that the local crate state held in this component is not the editor state. The editor state contains a working copy of the entities in the crate, while this provider contains a more static local copy that closely reflects the backend crate state, only serving to hide network latency.
 *  The editor state (working state) is found in the {@link editorState}.
 *
 * @example For example, when adding an entity, it is immediately added to the local copy of the crate state on a best-effort basis. At the same time, the request to the serviceProvider is sent. Once the serviceProvider responds with the actual result of adding the entity to the crate (which might include side effects), this result is then merged into the local state.
 *
 * @param serviceProvider Implementation of the CrateServiceAdapter interface.
 * @param children
 * @constructor
 */
export function CrateDataProvider({
    serviceProvider,
    children
}: PropsWithChildren<{ serviceProvider: CrateService }>) {
    const [crateId, setCrateId] = useState<string | undefined>(undefined)
    const getEntities = useEditorState((store) => store.getEntities)
    const setEntities = useEditorState((store) => store.setEntities)
    const crateContextReady = useEditorState((store) => store.crateContextReady)
    const updateCrateContext = useEditorState((store) => store.updateCrateContext)
    const updateInitialCrateContext = useEditorState((store) => store.updateInitialCrateContext)
    const setInitialEntities = useEditorState((store) => store.setInitialEntities)
    const { data, error, isLoading, mutate } = useSWR<ICrate>(crateId, serviceProvider.getCrate)
    const lastCrateData = useRef<ICrate | undefined>(undefined)
    const router = useRouter()
    const params = useParams<{ mode: string }>()

    // Backend health is periodically checked. When health is bad, error is in this state. If this state is undefined, backend is healthy
    // Might be unrelated to general crate error
    const [healthTestError, setHealthTestError] = useState<unknown>()

    /**
     * This effect is responsible for the continuous merging of the remote crate state into the local crate state
     */
    useEffect(() => {
        if (data) {
            // Initial crate context is currently useless as the context is always updated to the remote state
            // Might be used in the future if the context becomes more complex
            updateCrateContext(data["@context"])
            updateInitialCrateContext(data["@context"])

            setInitialEntities(new Map(data["@graph"].map((entity) => [entity["@id"], entity])))

            const entities = getEntities()

            if (!lastCrateData.current || entities.size === 0) {
                if (entities.size === 0) console.warn("Editor state was reset.")
                setEntities(new Map(data["@graph"].map((entity) => [entity["@id"], entity])))

                lastCrateData.current = data
                return
            }

            const updatedEntities = produce(entities, (newEntities) => {
                applyServerDifferences(data, lastCrateData.current, newEntities)
            })

            setEntities(updatedEntities)
            lastCrateData.current = data
        } else {
            editorState.setState((s) => {
                s.crateContextReady = false
            })
        }
    }, [
        data,
        getEntities,
        setEntities,
        setInitialEntities,
        updateCrateContext,
        updateInitialCrateContext
    ])

    const healthTest = useCallback(async () => {
        try {
            await serviceProvider.healthCheck()
            setHealthTestError((prev: unknown) => {
                if (prev !== undefined) {
                    toast.info("Crate service has recovered")
                }
                return undefined
            })
        } catch (e) {
            console.error("Health test failed with error", e)
            setHealthTestError((prev: unknown) => {
                if (prev === undefined) {
                    toast.error("Crate service is no longer reachable")
                }
                return e
            })
        }
    }, [serviceProvider])

    // Performs a health test every 10 seconds
    useInterval(healthTest, 10000)
    // Performs a health test immediately on mount or when the serviceProvider changes
    useEffect(() => {
        healthTest().then()
    }, [healthTest])

    /**
     * True while waiting for the remote to respond to an update operation.
     */
    const [isSaving, setIsSaving] = useState(false)
    /**
     * Map of entity ids to the most recent error encountered while updating the entity.
     */
    const [saveError, setSaveError] = useState<Map<string, unknown>>(new Map())

    const clearSaveError = useCallback((id?: string) => {
        if (id) {
            setSaveError(
                produce((draft) => {
                    draft.delete(id)
                })
            )
        } else {
            setSaveError(new Map())
        }
    }, [])

    /**
     * Automatically clears all save errors when the crateId changes.
     */
    useEffect(() => {
        clearSaveError()
    }, [clearSaveError, crateId])

    /**
     * Saves or creates an entity based on its content. It is automatically determined whether the entity has to be created or updated.
     * @param entityData The entity to be saved or created.
     * @param mutateNow Setting mutateNow to false will not optimistically update the local crate state. This should be done when updating many entities at once for performance reasons. The local state will be updated on the next backend sync automatically.
     * @returns {boolean} Whether the operation was successful. When the operation is not successful, returns false and updates the saveError map. Also directly toasts a success or failure message to the interface.
     */
    const saveEntity = useCallback(
        async (entityData: IEntity, mutateNow: boolean = true) => {
            if (crateId) {
                setIsSaving(true)
                try {
                    const fn = lastCrateData.current?.["@graph"].find(
                        (e) => e["@id"] === entityData["@id"]
                    )
                        ? serviceProvider.updateEntity.bind(serviceProvider)
                        : serviceProvider.createEntity.bind(serviceProvider)

                    const updateResult = await fn(crateId, entityData)
                    setIsSaving(false)
                    setSaveError(
                        produce((draft) => {
                            draft.delete(entityData["@id"])
                        })
                    )

                    if (data && mutateNow) {
                        if (updateResult)
                            toast(
                                <div className="flex items-center">
                                    <EntityIcon entity={entityData} />{" "}
                                    {getEntityDisplayName(entityData)} saved
                                </div>,
                                { duration: 2000 }
                            )

                        const newData = produce<ICrate>(data, (newData: Draft<ICrate>) => {
                            const index = newData["@graph"].findIndex(
                                (e) => e["@id"] === entityData["@id"]
                            )
                            if (index >= 0) {
                                newData["@graph"][index] = entityData
                            } else {
                                newData["@graph"].push(entityData)
                            }
                        })

                        await mutate(newData)
                    }

                    if (!updateResult)
                        toast(
                            <div className="flex items-center text-warn">
                                <TriangleAlert className="size-4 mr-2" />
                                Could not save changes to <EntityIcon entity={entityData} />{" "}
                                {getEntityDisplayName(entityData)}
                            </div>
                        )

                    return updateResult
                } catch (e) {
                    console.error("Error occurred while trying to update entity", e)
                    toast.warning(
                        <div>
                            <TriangleAlert className="size-4 mr-1 inline-block text-warn" /> Could
                            not save changes to <EntityIcon entity={entityData} className="mr-1" />
                            {getEntityDisplayName(entityData)}
                        </div>
                    )
                    setSaveError(
                        produce((draft) => {
                            draft.set(entityData["@id"], e)
                        })
                    )
                    setIsSaving(false)
                    return false
                }
            } else return false
        },
        [crateId, serviceProvider, data, mutate]
    )

    const saveAllEntities = useCallback(
        async (entities: IEntity[]) => {
            for (const entity of entities) {
                await saveEntity(entity, false)
            }

            if (entities.length > 0) toast(`Saved changes to ${entities.length} entities`)

            await mutate()
        },
        [mutate, saveEntity]
    )

    const createFileEntity = useCallback(
        async (entity: IEntity, file: File, overwrite = false) => {
            if (crateId) {
                setIsSaving(true)
                try {
                    const result = await serviceProvider.createFileEntity(
                        crateId,
                        entity,
                        file,
                        overwrite
                    )
                    setIsSaving(false)
                    await mutate()

                    return result
                } catch (e) {
                    console.error("Error occurred while trying to create file entity", e)
                    setSaveError(
                        produce((draft) => {
                            draft.set(entity["@id"], e)
                        })
                    )
                    setIsSaving(false)
                    return false
                }
            } else return false
        },
        [mutate, crateId, serviceProvider]
    )

    const createFolderEntity = useCallback(
        async (
            entity: IEntity,
            files: IEntityWithFile[],
            progressCallback?: (current: number, max: number, errors: unknown[]) => void
        ) => {
            if (crateId) {
                setIsSaving(true)
                try {
                    const folderResult = await serviceProvider.createEntity(crateId, entity)

                    if (!folderResult) return false

                    const errors: unknown[] = []
                    let progress = 0

                    for (const file of files) {
                        try {
                            const result = await serviceProvider.createFileEntity(
                                crateId,
                                file.entity,
                                file.file
                            )
                            if (progressCallback) progressCallback(progress++, files.length, errors)
                            if (!result) errors.push("Failed to upload file " + file.entity["@id"])
                        } catch (e) {
                            errors.push(e)
                            if (progressCallback) progressCallback(progress++, files.length, errors)
                        }
                    }

                    setIsSaving(false)
                    mutate().then()

                    return true
                } catch (e) {
                    console.error("Error occurred while trying to create file entity", e)
                    setSaveError(
                        produce((draft) => {
                            draft.set(entity["@id"], e)
                        })
                    )
                    setIsSaving(false)
                    return false
                }
            } else return false
        },
        [mutate, crateId, serviceProvider]
    )

    const deleteEntity = useCallback(
        async (entityData: IEntity) => {
            if (crateId) {
                try {
                    const deleteResult = await serviceProvider.deleteEntity(crateId, entityData)

                    if (data) {
                        const newData = produce<ICrate>(data, (newData: Draft<ICrate>) => {
                            const index = newData["@graph"].findIndex(
                                (e) => e["@id"] === entityData["@id"]
                            )
                            if (index >= 0) newData["@graph"].splice(index, 1)
                        })

                        await mutate(newData)
                    }

                    return deleteResult
                } catch (e) {
                    console.error("Error occurred while trying to delete entity", e)
                    setSaveError(
                        produce((draft) => {
                            draft.set(entityData["@id"], e)
                        })
                    )
                    return false
                }
            } else return false
        },
        [data, mutate, crateId, serviceProvider]
    )

    const renameEntity = useCallback(
        async (entityData: IEntity, newEntityId: string) => {
            if (crateId) {
                try {
                    const renameResult = await serviceProvider.renameEntity(
                        crateId,
                        entityData,
                        newEntityId
                    )

                    if (data) {
                        const newData = produce<ICrate>(data, (newData: Draft<ICrate>) => {
                            changeEntityId(newData["@graph"], entityData["@id"], newEntityId)
                        })

                        await mutate(newData)
                    }

                    return renameResult
                } catch (e) {
                    console.error("Error occurred while trying to rename entity", e)
                    setSaveError(
                        produce((draft) => {
                            draft.set(entityData["@id"], e)
                        })
                    )
                    return false
                }
            } else return false
        },
        [data, mutate, crateId, serviceProvider]
    )

    const addCustomContextPair = useCallback(
        async (key: string, value: string) => {
            if (crateId) {
                await serviceProvider.addCustomContextPair(crateId, key, value)
                await mutate()
            }
        },
        [mutate, crateId, serviceProvider]
    )

    const removeCustomContextPair = useCallback(
        async (key: string) => {
            if (crateId) {
                await serviceProvider.removeCustomContextPair(crateId, key)
                await mutate()
            }
        },
        [mutate, crateId, serviceProvider]
    )

    const saveRoCrateMetadataJSON = useCallback(
        async (json: string) => {
            if (crateId) {
                await serviceProvider.saveRoCrateMetadataJSON(crateId, json)
                await mutate()
            }
        },
        [mutate, crateId, serviceProvider]
    )

    /**
     * This effect handles retrieving the crateId of the current crate. Once a crate is selected in the main menu, its crateId is saved
     * to local storage and then retrieved by this hook when in the editor. When no crateId is found in local storage and it is not known
     * otherwise, this hook redirects to the main menu.
     */
    useEffect(() => {
        if (!serviceProvider.featureFlags.crateSelectionControlledExternally) {
            if (crateId) {
                console.log("CrateID known, saving")
                localStorage.setItem(CRATE_ID_STORAGE_KEY, crateId)
            } else {
                console.log("CrateID unknown, looking in local storage...")
                const saved = localStorage.getItem(CRATE_ID_STORAGE_KEY)
                if (saved) {
                    setCrateId(saved)
                    console.log("CrateID found in local storage", saved)
                } else {
                    router.push("/editor")
                    console.log("Nothing found in local storage, navigating to landing page")
                }
            }
        }
    }, [
        crateId,
        params.mode,
        router,
        serviceProvider.featureFlags.crateSelectionControlledExternally
    ])

    const unsetCrateId = useCallback(() => {
        setCrateId(undefined)
        localStorage.removeItem(CRATE_ID_STORAGE_KEY)
    }, [])

    /**
     * True iff the CrateDataProvider is done with loading the crate state from the backend.
     */
    const ready = useMemo(() => {
        return crateContextReady && data !== undefined && !isLoading
    }, [data, crateContextReady, isLoading])

    return (
        <CrateDataContext.Provider
            value={{
                serviceProvider: serviceProvider,
                crateId: crateId || "",
                // Force the editor into a global loading state until everything is settled
                crateData: ready ? data : undefined,
                crateDataIsLoading: isLoading || !crateContextReady,
                saveEntity,
                saveAllEntities,
                createFileEntity,
                createFolderEntity,
                deleteEntity,
                renameEntity,
                isSaving,
                reload: mutate,
                saveError,
                error,
                addCustomContextPair,
                removeCustomContextPair,
                saveRoCrateMetadataJSON,
                setCrateId,
                unsetCrateId,
                clearSaveError,
                healthTestError
            }}
        >
            {children}
        </CrateDataContext.Provider>
    )
}
