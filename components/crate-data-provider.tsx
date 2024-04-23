"use client"

import { createContext, PropsWithChildren, useCallback } from "react"
import { Error } from "@/components/error"
import useSWR from "swr"
import { Context } from "@/lib/crate-verify/context"

export interface ICrateDataProvider {
    crateId: string
    crateData?: ICrate
    crateDataIsLoading: boolean
    setCrateData: (data: ICrate) => void
    updateEntity: (entity: IFlatEntity) => Promise<boolean>
}

// TODO remove
export const TEST_CONTEXT = new Context("https://w3id.org/ro/crate/1.1/context")

export const CrateDataContext = createContext<ICrateDataProvider>({
    crateId: "",
    setCrateData: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    updateEntity: () => {
        return Promise.reject("Crate Data Provider not mounted yet")
    },
    crateDataIsLoading: false
})

export function CrateDataProvider(
    props: PropsWithChildren<{ serviceProvider: CrateServiceProvider; crateId?: string }>
) {
    const { data, error, isLoading, mutate } = useSWR<ICrate>(
        props.crateId,
        props.serviceProvider.getCrate
    )

    const updateEntity = useCallback(
        async (entityData: IFlatEntity) => {
            if (props.crateId) {
                try {
                    const updateResult = await props.serviceProvider.updateEntity(
                        props.crateId,
                        entityData
                    )

                    if (data) {
                        const existingIndex = data["@graph"].findIndex(
                            (e) => e["@id"] === entityData["@id"]
                        )

                        if (existingIndex < 0) {
                            data["@graph"].push(entityData)
                        } else {
                            data["@graph"][existingIndex] = entityData
                        }

                        await mutate(data)
                    }

                    return updateResult
                } catch (e) {
                    console.error("Error occurred while trying to update entity", e)
                    throw e
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
                setCrateData: () => {},
                crateDataIsLoading: isLoading,
                updateEntity
            }}
        >
            <Error text={error ? error + "" : ""} size={"xl"} />
            {props.children}
        </CrateDataContext.Provider>
    )
}
