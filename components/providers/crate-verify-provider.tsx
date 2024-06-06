import { schemaWorkerFunctions } from "@/lib/schema-worker/helpers"
import { createContext, PropsWithChildren } from "react"
import { FunctionWorker } from "@/lib/function-worker"
import { useFunctionWorker } from "@/lib/use-function-worker"

export interface ICrateVerifyContext {
    isReady: boolean
    isUsingWebWorker: boolean
    worker: FunctionWorker<typeof schemaWorkerFunctions>
}

export const CrateVerifyContext = createContext<ICrateVerifyContext>({
    isReady: false,
    isUsingWebWorker: false,
    get worker(): FunctionWorker<typeof schemaWorkerFunctions> {
        throw "Context not mounted"
    }
})

export function CrateVerifyProvider(props: PropsWithChildren) {
    const { worker, isUsingWebWorker, isReady } = useFunctionWorker(
        schemaWorkerFunctions,
        "/schema-worker.js"
    )

    return (
        <CrateVerifyContext.Provider
            value={{
                isReady,
                isUsingWebWorker,
                worker
            }}
        >
            {props.children}
        </CrateVerifyContext.Provider>
    )
}
