import { schemaWorkerFunctions } from "@/lib/schema-worker/helpers"
import { createContext, PropsWithChildren, useEffect } from "react"
import { FunctionWorker } from "@/lib/function-worker"
import { useFunctionWorker } from "@/lib/use-function-worker"
import { addBasePath } from "next/dist/client/add-base-path"
import { schemaResolverStore } from "@/lib/state/schema-resolver"

export interface ISchemaWorkerContext {
    isReady: boolean
    isUsingWebWorker: boolean
    worker: FunctionWorker<typeof schemaWorkerFunctions>
}

export const SchemaWorker = createContext<ISchemaWorkerContext>({
    isReady: false,
    isUsingWebWorker: false,
    get worker(): FunctionWorker<typeof schemaWorkerFunctions> {
        throw "Context not mounted"
    }
})

export function CrateVerifyProvider(props: PropsWithChildren) {
    const { worker, isUsingWebWorker, isReady } = useFunctionWorker(
        schemaWorkerFunctions,
        addBasePath("/schema-worker.js")
    )

    useEffect(() => {
        if (isReady) {
            worker.execute("updateSchemaResolverState", schemaResolverStore.getState()).then()

            return schemaResolverStore.subscribe((newState) => {
                worker.execute("updateSchemaResolverState", newState).then()
            })
        }
    }, [isReady, worker])

    return (
        <SchemaWorker.Provider
            value={{
                isReady,
                isUsingWebWorker,
                worker
            }}
        >
            {props.children}
        </SchemaWorker.Provider>
    )
}
