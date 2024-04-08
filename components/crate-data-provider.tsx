"use client"

import { createContext, PropsWithChildren } from "react"
import { Error } from "@/components/error"
import useSWR from "swr"
import { Context } from "@/lib/crate-verify/context"

export interface ICrateDataProvider {
    crateId: string
    crateData?: ICrate
    crateDataIsLoading: boolean
    setCrateData: (data: ICrate) => void
}

// TODO remove
export const TEST_CONTEXT = new Context("https://w3id.org/ro/crate/1.1/context")

export const CrateDataContext = createContext<ICrateDataProvider>({
    crateId: "",
    setCrateData: () => {},
    crateDataIsLoading: false
})

export function CrateDataProvider(
    props: PropsWithChildren<{ serviceProvider: CrateServiceProvider; crateId?: string }>
) {
    const { data, error, isLoading } = useSWR<ICrate>(props.crateId, props.serviceProvider.getCrate)

    return (
        <CrateDataContext.Provider
            value={{
                crateId: props.crateId || "",
                crateData: data,
                setCrateData: () => {},
                crateDataIsLoading: isLoading
            }}
        >
            <Error text={error} size={"xl"} />
            {props.children}
        </CrateDataContext.Provider>
    )
}
