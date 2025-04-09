"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { useEditorState } from "@/lib/state/editor-state"
import { Draft, produce } from "immer"
import { applyServerDifferences } from "@/lib/ensure-sync"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { getEntityDisplayName } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"
import { useInterval } from "usehooks-ts"

const CRATE_ID_STORAGE_KEY = "crate-id"

export interface ICrateDataProvider {
    readonly serviceProvider?: CrateServiceAdapter
    crateId?: string
    setCrateId(crateId: string): void
    unsetCrateId(): void
    crateData?: ICrate
    crateDataIsLoading: boolean
    saveEntity(entity: IEntity): Promise<boolean>
    saveAllEntities(entities: IEntity[]): Promise<void>
    createFileEntity(entity: IEntity, file: File): Promise<boolean>
    createFolderEntity(
        entity: IEntity,
        files: IEntityWithFile[],
        progressCallback?: (current: number, max: number, errors: unknown[]) => void
    ): Promise<boolean>
    deleteEntity(entity: IEntity): Promise<boolean>
    addCustomContextPair(key: string, value: string): Promise<void>
    removeCustomContextPair(key: string): Promise<void>
    saveRoCrateMetadataJSON(json: string): Promise<void>
    importEntityFromOrcid(url: string): Promise<string>
    importOrganizationFromRor(url: string): Promise<string>
    reload(): void
    isSaving: boolean
    saveError: Map<string, unknown>
    clearSaveError(id?: string): void
    error: unknown
    healthTestError: unknown
}

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
    importEntityFromOrcid(): Promise<string> {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    importOrganizationFromRor(): Promise<string> {
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

export function CrateDataProvider({
    serviceProvider,
    children
}: PropsWithChildren<{ serviceProvider: CrateServiceAdapter }>) {
    const [crateId, setCrateId] = useState<string | undefined>(undefined)
    const getEntities = useEditorState.useGetEntities()
    const setEntities = useEditorState.useSetEntities()
    const setCrateContext = useEditorState.useSetCrateContext()
    const setInitialCrateContext = useEditorState.useSetInitialCrateContext()
    const setInitialEntities = useEditorState.useSetInitialEntities()
    const { data, error, isLoading, mutate } = useSWR<ICrate>(crateId, serviceProvider.getCrate)
    const lastCrateData = useRef<ICrate | undefined>(undefined)
    const router = useRouter()

    // Backend health is periodically checked. When health is bad, error is in this state. If this state is undefined, backend is healthy
    // Might be unrelated to general crate error
    const [healthTestError, setHealthTestError] = useState<unknown>()

    useEffect(() => {
        if (data) {
            // Initial crate context is currently useless as the context is always updated to the server state
            // Might be used in the future if the context becomes more complex
            setInitialCrateContext(data["@context"])
            setCrateContext(data["@context"])
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
        }
    }, [
        data,
        getEntities,
        setCrateContext,
        setEntities,
        setInitialCrateContext,
        setInitialEntities
    ])

    const healthTest = useCallback(async () => {
        try {
            console.log("running health test")
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

    useInterval(healthTest, 10000)
    useEffect(() => {
        healthTest().then()
    }, [healthTest])

    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<Map<string, any>>(new Map())

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

    useEffect(() => {
        clearSaveError()
    }, [clearSaveError, crateId])

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
                                <TriangleAlert className="w-4 h-4 mr-2" />
                                Could not save changes to <EntityIcon entity={entityData} />{" "}
                                {getEntityDisplayName(entityData)}
                            </div>
                        )

                    return updateResult
                } catch (e) {
                    console.error("Error occurred while trying to update entity", e)
                    toast.warning(
                        <div>
                            <TriangleAlert className="w-4 h-4 mr-1 inline-block text-warn" /> Could
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
        async (entity: IEntity, file: File) => {
            if (crateId) {
                setIsSaving(true)
                try {
                    const result = await serviceProvider.createFileEntity(crateId, entity, file)
                    setIsSaving(false)
                    mutate().then()

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

    const importEntityFromOrcid = useCallback(
        async (url: string) => {
            if (crateId) {
                const id = await serviceProvider.importEntityFromOrcid(crateId, url)
                await mutate()
                return id
            }
            throw "crateId is undefined"
        },
        [mutate, crateId, serviceProvider]
    )

    const importOrganizationFromRor = useCallback(
        async (url: string) => {
            if (crateId) {
                const id = await serviceProvider.importOrganizationFromRor(crateId, url)
                await mutate()
                return id
            }
            throw "crateId is undefined"
        },
        [mutate, crateId, serviceProvider]
    )

    useEffect(() => {
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
    }, [crateId, router])

    const unsetCrateId = useCallback(() => {
        setCrateId(undefined)
        localStorage.removeItem(CRATE_ID_STORAGE_KEY)
    }, [])

    return (
        <CrateDataContext.Provider
            value={{
                serviceProvider: serviceProvider,
                crateId: crateId || "",
                crateData: data,
                crateDataIsLoading: isLoading,
                saveEntity,
                saveAllEntities,
                createFileEntity,
                createFolderEntity,
                deleteEntity,
                isSaving,
                reload: mutate,
                importEntityFromOrcid,
                importOrganizationFromRor,
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
