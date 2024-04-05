"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useState } from "react"
import { Error } from "@/components/error"
import useSWR from "swr"

export interface ICrateDataProvider {
    crateData?: ICrate
    crateDataIsLoading: boolean
    setCrateData: (data: ICrate) => void
}

export const CrateDataContext = createContext<ICrateDataProvider>({
    setCrateData: () => {},
    crateDataIsLoading: false
})

export function CrateDataProvider(
    props: PropsWithChildren<{ serviceProvider: CrateServiceProvider; crateId?: string }>
) {
    const { data, error, isLoading } = useSWR<ICrate>(props.crateId, props.serviceProvider.getCrate)

    return (
        <CrateDataContext.Provider
            value={{ crateData: data, setCrateData: () => {}, crateDataIsLoading: isLoading }}
        >
            <Error text={error} size={"xl"} />
            {props.children}
        </CrateDataContext.Provider>
    )
}
