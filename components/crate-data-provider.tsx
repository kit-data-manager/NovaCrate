"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import { Error } from "@/components/error"
import useSWR from "swr"
import { useEditorState } from "@/components/editor-state"
import { Draft, produce } from "immer"
import { applyServerDifferences } from "@/components/ensure-sync"

export interface ICrateDataProvider {
    readonly serviceProvider?: CrateServiceProvider
    crateId: string
    crateData?: ICrate
    crateDataIsLoading: boolean
    saveEntity(entity: IFlatEntity): Promise<boolean>
    deleteEntity(entity: IFlatEntity): Promise<boolean>
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
    deleteEntity: () => {
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
            console.log("Updating initialCrateContext and initialEntities", data)
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
        async (entityData: IFlatEntity) => {
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

                    if (data) {
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

    return (
        <CrateDataContext.Provider
            value={{
                serviceProvider: props.serviceProvider,
                crateId: props.crateId || "",
                crateData: data,
                crateDataIsLoading: isLoading,
                saveEntity,
                deleteEntity,
                isSaving,
                reload: mutate,
                saveError,
                error
            }}
        >
            {props.children}
        </CrateDataContext.Provider>
    )
}
