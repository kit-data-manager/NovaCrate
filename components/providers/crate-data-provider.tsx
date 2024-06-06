"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { useEditorState } from "@/lib/state/editor-state"
import { Draft, produce } from "immer"
import { applyServerDifferences } from "@/lib/ensure-sync"

export interface ICrateDataProvider {
    readonly serviceProvider?: CrateServiceProvider
    crateId: string
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
    crateId: "",
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
    error: undefined
})

export function CrateDataProvider(
    props: PropsWithChildren<{ serviceProvider: CrateServiceProvider; crateId?: string }>
) {
    const getEntities = useEditorState.useGetEntities()
    const setEntities = useEditorState.useSetEntities()
    const setCrateContext = useEditorState.useSetCrateContext()
    const setInitialCrateContext = useEditorState.useSetInitialCrateContext()
    const setInitialEntities = useEditorState.useSetInitialEntities()
    const { data, error, isLoading, mutate } = useSWR<ICrate>(
        props.crateId,
        props.serviceProvider.getCrate
    )
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
            if (props.crateId) {
                setIsSaving(true)
                try {
                    const fn = lastCrateData.current?.["@graph"].find(
                        (e) => e["@id"] === entityData["@id"]
                    )
                        ? props.serviceProvider.updateEntity.bind(props.serviceProvider)
                        : props.serviceProvider.createEntity.bind(props.serviceProvider)

                    const updateResult = await fn(props.crateId, entityData)
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
        [data, mutate, props.crateId, props.serviceProvider]
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
            if (props.crateId) {
                setIsSaving(true)
                try {
                    const result = await props.serviceProvider.createFileEntity(
                        props.crateId,
                        entity,
                        file
                    )
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
        [mutate, props.crateId, props.serviceProvider]
    )

    const createFolderEntity = useCallback(
        async (
            entity: IFlatEntity,
            files: IFlatEntityWithFile[],
            progressCallback?: (current: number, max: number, errors: unknown[]) => void
        ) => {
            if (props.crateId) {
                setIsSaving(true)
                try {
                    const folderResult = await props.serviceProvider.createEntity(
                        props.crateId,
                        entity
                    )

                    if (!folderResult) return false

                    const errors: unknown[] = []
                    let progress = 0

                    for (const file of files) {
                        try {
                            const result = await props.serviceProvider.createFileEntity(
                                props.crateId,
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
        [mutate, props.crateId, props.serviceProvider]
    )

    const deleteEntity = useCallback(
        async (entityData: IFlatEntity) => {
            if (props.crateId) {
                try {
                    const deleteResult = await props.serviceProvider.deleteEntity(
                        props.crateId,
                        entityData
                    )

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
        [data, mutate, props.crateId, props.serviceProvider]
    )

    const addCustomContextPair = useCallback(
        async (key: string, value: string) => {
            if (props.crateId) {
                await props.serviceProvider.addCustomContextPair(props.crateId, key, value)
                await mutate()
            }
        },
        [mutate, props.crateId, props.serviceProvider]
    )

    const removeCustomContextPair = useCallback(
        async (key: string) => {
            if (props.crateId) {
                await props.serviceProvider.removeCustomContextPair(props.crateId, key)
                await mutate()
            }
        },
        [mutate, props.crateId, props.serviceProvider]
    )

    const saveRoCrateMetadataJSON = useCallback(
        async (json: string) => {
            if (props.crateId) {
                await props.serviceProvider.saveRoCrateMetadataJSON(props.crateId, json)
                await mutate()
            }
        },
        [mutate, props.crateId, props.serviceProvider]
    )

    const importEntityFromOrcid = useCallback(
        async (url: string) => {
            if (props.crateId) {
                const id = await props.serviceProvider.importEntityFromOrcid(props.crateId, url)
                await mutate()
                return id
            }
            throw "crateId is undefined"
        },
        [mutate, props.crateId, props.serviceProvider]
    )

    const importOrganizationFromRor = useCallback(
        async (url: string) => {
            if (props.crateId) {
                const id = await props.serviceProvider.importOrganizationFromRor(props.crateId, url)
                await mutate()
                return id
            }
            throw "crateId is undefined"
        },
        [mutate, props.crateId, props.serviceProvider]
    )

    return (
        <CrateDataContext.Provider
            value={{
                serviceProvider: props.serviceProvider,
                crateId: props.crateId || "",
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
                saveRoCrateMetadataJSON
            }}
        >
            {props.children}
        </CrateDataContext.Provider>
    )
}
