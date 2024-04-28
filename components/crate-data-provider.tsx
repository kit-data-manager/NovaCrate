"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import { Error } from "@/components/error"
import useSWR from "swr"
import { CrateContext } from "@/lib/crate-context"
import { useEditorState } from "@/components/editor-state"
import { Draft, produce } from "immer"
import { computeServerDifferences, executeForcedUpdates } from "@/components/ensure-sync"

export interface ICrateDataProvider {
    crateId: string
    crateData?: ICrate
    crateDataIsLoading: boolean
    saveEntity: (entity: IFlatEntity) => Promise<boolean>
    isSaving: boolean
    saveError: string
}

// TODO remove
export const TEST_CONTEXT = new CrateContext("https://w3id.org/ro/crate/1.1/context")

export const CrateDataContext = createContext<ICrateDataProvider>({
    crateId: "",
    saveEntity: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    crateDataIsLoading: false,
    isSaving: false,
    saveError: ""
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

            const { forceProperties, forceEntities } = computeServerDifferences(
                data,
                lastCrateData.current,
                entities
            )

            const updatedEntities = produce(entities, (newEntities) => {
                executeForcedUpdates(newEntities, forceEntities, forceProperties)
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
    const [saveError, setSaveError] = useState("")

    const saveEntity = useCallback(
        async (entityData: IFlatEntity) => {
            if (props.crateId) {
                setIsSaving(true)
                try {
                    const updateResult = await props.serviceProvider.updateEntity(
                        props.crateId,
                        entityData
                    )
                    setIsSaving(false)
                    setSaveError("")

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
                    setSaveError(typeof e === "object" ? JSON.stringify(e) : e + "")
                    return false
                }
            } else return false
        },
        [data, mutate, props.crateId, props.serviceProvider]
    )

    return (
        <CrateDataContext.Provider
            value={{
                crateId: props.crateId || "",
                crateData: data,
                crateDataIsLoading: isLoading,
                saveEntity,
                isSaving,
                saveError
            }}
        >
            <Error text={error ? error + "" : ""} size={"xl"} />
            {props.children}
        </CrateDataContext.Provider>
    )
}
