"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { useEditorState } from "@/lib/state/editor-state"
import { Draft, produce } from "immer"
import { applyServerDifferences } from "@/lib/ensure-sync"

const CRATE_ID_STORAGE_KEY = "crate-id"

export interface ICrateDataProvider {
    readonly serviceProvider?: CrateServiceProvider
    crateId?: string
    setCrateId(crateId: string): void
    unsetCrateId(): void
    crateData?: ICrate
    crateDataIsLoading: boolean
    saveEntity(entity: IFlatEntity): Promise<boolean>
    saveAllEntities(entities: IFlatEntity[]): Promise<void>
    createFileEntity(entity: IFlatEntity, file: File): Promise<boolean>
    createFolderEntity(
        entity: IFlatEntity,
        files: IFlatEntityWithFile[],
        progressCallback?: (current: number, max: number, errors: unknown[]) => void
    ): Promise<boolean>
    deleteEntity(entity: IFlatEntity): Promise<boolean>
    addCustomContextPair(key: string, value: string): Promise<void>
    removeCustomContextPair(key: string): Promise<void>
    saveRoCrateMetadataJSON(json: string): Promise<void>
    importEntityFromOrcid(url: string): Promise<string>
    importOrganizationFromRor(url: string): Promise<string>
    reload(): void
    isSaving: boolean
    saveError: unknown
    error: unknown
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
    saveError: undefined,
    error: undefined,
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
}: PropsWithChildren<{ serviceProvider: CrateServiceProvider }>) {
    const [crateId, setCrateId] = useState<string | undefined>(undefined)
    const getEntities = useEditorState.useGetEntities()
    const setEntities = useEditorState.useSetEntities()
    const setCrateContext = useEditorState.useSetCrateContext()
    const setInitialCrateContext = useEditorState.useSetInitialCrateContext()
    const setInitialEntities = useEditorState.useSetInitialEntities()
    const { data, error, isLoading, mutate } = useSWR<ICrate>(crateId, serviceProvider.getCrate)
    const lastCrateData = useRef<ICrate | undefined>(undefined)

    useEffect(() => {
        if (data) {
            // Initial crate context is currently useless as the context is always updated to the server state
            // Might be used in the future if the context becomes more complex
            setInitialCrateContext(data["@context"])
            setCrateContext(data["@context"])
            setInitialEntities(new Map(data["@graph"].map((entity) => [entity["@id"], entity])))

            if (!lastCrateData.current) {
                setEntities(new Map(data["@graph"].map((entity) => [entity["@id"], entity])))

                lastCrateData.current = data
                return
            }

            const entities = getEntities()

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

    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<any>()

    const saveEntity = useCallback(
        async (entityData: IFlatEntity, mutateNow: boolean = true) => {
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
                    setSaveError(undefined)

                    if (data && mutateNow) {
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

                    return updateResult
                } catch (e) {
                    console.error("Error occurred while trying to update entity", e)
                    setSaveError(e)
                    setIsSaving(false)
                    return false
                }
            } else return false
        },
        [data, mutate, crateId, serviceProvider]
    )

    const saveAllEntities = useCallback(
        async (entities: IFlatEntity[]) => {
            for (const entity of entities) {
                await saveEntity(entity, false)
            }

            await mutate()
        },
        [mutate, saveEntity]
    )

    const createFileEntity = useCallback(
        async (entity: IFlatEntity, file: File) => {
            if (crateId) {
                setIsSaving(true)
                try {
                    const result = await serviceProvider.createFileEntity(crateId, entity, file)
                    setIsSaving(false)
                    setSaveError(undefined)
                    mutate().then()

                    return result
                } catch (e) {
                    console.error("Error occurred while trying to create file entity", e)
                    setSaveError(e)
                    setIsSaving(false)
                    return false
                }
            } else return false
        },
        [mutate, crateId, serviceProvider]
    )

    const createFolderEntity = useCallback(
        async (
            entity: IFlatEntity,
            files: IFlatEntityWithFile[],
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
                    setSaveError(undefined)
                    mutate().then()

                    return true
                } catch (e) {
                    console.error("Error occurred while trying to create file entity", e)
                    setSaveError(e)
                    setIsSaving(false)
                    return false
                }
            } else return false
        },
        [mutate, crateId, serviceProvider]
    )

    const deleteEntity = useCallback(
        async (entityData: IFlatEntity) => {
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
                    setSaveError(e)
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
            localStorage.setItem(CRATE_ID_STORAGE_KEY, crateId)
        } else {
            const saved = localStorage.getItem(CRATE_ID_STORAGE_KEY)
            if (saved) setCrateId(saved)
        }
    }, [crateId])

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
                unsetCrateId
            }}
        >
            {children}
        </CrateDataContext.Provider>
    )
}
