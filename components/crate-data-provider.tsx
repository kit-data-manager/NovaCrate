"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import { Error } from "@/components/error"
import useSWR from "swr"
import { CrateContext } from "@/lib/crateContext"
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
    const entities = useEditorState.useEntities()
    const setEntities = useEditorState.useSetEntities()
    const setCrateContext = useEditorState.useSetCrateContext()
    const setInitialCrateContext = useEditorState.useSetInitialCrateContext()
    const setInitialEntities = useEditorState.useSetInitialEntities()
    const { data, error, isLoading, mutate } = useSWR<ICrate>(
        props.crateId,
        props.serviceProvider.getCrate
    )
    const lastCrateData = useRef<ICrate | undefined>(undefined)

    const entitiesRef = useRef(entities)

    useEffect(() => {
        if (data) {
            console.log("Updating initialCrateContext and initialEntities", data)
            setInitialCrateContext(data["@context"])
            setInitialEntities(new Map(data["@graph"].map((entity) => [entity["@id"], entity])))

            if (!lastCrateData.current) {
                setEntities(new Map(data["@graph"].map((entity) => [entity["@id"], entity])))
                setCrateContext(data["@context"])
                lastCrateData.current = data
                return
            }

            const { forceProperties, forceEntities } = computeServerDifferences(
                data,
                lastCrateData.current,
                entitiesRef.current
            )

            const updatedEntities = produce(entitiesRef.current, (newEntities) => {
                executeForcedUpdates(newEntities, forceEntities, forceProperties)
            })

            setEntities(updatedEntities)
            lastCrateData.current = data
        }
    }, [data, setCrateContext, setEntities, setInitialCrateContext, setInitialEntities])

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
