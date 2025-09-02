import { schemaWorkerFunctions } from "@/lib/schema-worker/helpers"
import { createContext, PropsWithChildren, useEffect } from "react"
import { FunctionWorker } from "@/lib/function-worker"
import { useFunctionWorker } from "@/lib/use-function-worker"
import { addBasePath } from "next/dist/client/add-base-path"
import { schemaResolverStore } from "@/lib/state/schema-resolver"
import { useEditorState } from "@/lib/state/editor-state"

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

export function SchemaWorkerProvider(props: PropsWithChildren) {
    const { worker, isUsingWebWorker, isReady } = useFunctionWorker(
        schemaWorkerFunctions,
        addBasePath("/schema-worker.js"),
        { memoize: true, memoizeMaxAge: 5000 }
    )
    const context = useEditorState((state) => state.crateContext)

    useEffect(() => {
        if (isReady && context.specification) {
            worker
                .executeUncached(
                    "updateRegisteredSchemas",
                    schemaResolverStore.getState().registeredSchemas,
                    context.specification
                )
                .then()

            return schemaResolverStore.subscribe((newState) => {
                if (context.specification)
                    worker
                        .executeUncached(
                            "updateRegisteredSchemas",
                            newState.registeredSchemas,
                            context.specification
                        )
                        .then()
            })
        }
    }, [context.specification, isReady, worker])

    useEffect(() => {
        // Clear cache on context change
        console.log("Clearing schema worker cache")
        worker.clearExecuteCache()
    }, [context, worker])

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
