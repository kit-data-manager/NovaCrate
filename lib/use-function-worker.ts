import { useCallback, useEffect, useRef, useState } from "react"
import { FunctionWorker, FunctionWorkerOptions } from "@/lib/function-worker"
import { useInterval } from "usehooks-ts"

/**
 * React hook to use a function worker. Supply this hook with the flat object of functions that the function worker script receives. Build the function worker script into a bundle and specify the bundle path as scriptPath.
 * When the worker is not mounted, the function will be run locally instead.
 * @param functions Flat object of functions that the function worker can run (the same object that was passed to the function worker)
 * @param scriptPath Path to the script of the function worker
 * @param options Options for the function worker
 */
export function useFunctionWorker<T extends Record<string, (...args: any[]) => any>>(
    functions: T,
    scriptPath: string,
    options?: FunctionWorkerOptions
) {
    const functionWorker = useRef(new FunctionWorker(functions, options))
    const scriptPathRef = useRef(scriptPath)

    const [isReady, setIsReady] = useState(false)
    const [isUsingWebWorker, setIsUsingWebWorker] = useState(true)

    useEffect(() => {
        let usesWebWorker
        try {
            usesWebWorker = functionWorker.current.mount(scriptPathRef.current)
        } catch (e) {
            console.error(`Failed to mount function worker ${scriptPathRef.current}`, e)
        }

        if (!usesWebWorker || !functionWorker.current.workerMounted) setIsUsingWebWorker(false)
        setIsReady(true)
    }, [])

    useEffect(() => {
        function errorHandler(e: unknown) {
            console.error("Error in function worker", e)
        }

        if (isReady && isUsingWebWorker) {
            const worker = functionWorker.current.worker
            if (!worker) return
            worker.addEventListener("error", errorHandler)

            return () => worker.removeEventListener("error", errorHandler)
        }
    }, [isReady, isUsingWebWorker])

    const healthTest = useCallback(async () => {
        if (isReady && isUsingWebWorker) {
            const healthy = functionWorker.current.healthTest()
            const timeout = new Promise((res) => setTimeout(() => res("timeout"), 9000))
            const result = await Promise.race([healthy, timeout])
            if (result === false || result === "timeout") {
                if (result === false)
                    console.error(
                        "useFunctionWorker: Health test failed, assuming worker has crashed"
                    )
                if (result === "timeout")
                    console.error(
                        "useFunctionWorker: Timeout during health test, assuming worker has crashed"
                    )
                setIsUsingWebWorker(false)
                functionWorker.current.unmount()
            }
        }
    }, [isReady, isUsingWebWorker])

    useInterval(healthTest, 10000)

    return { isReady, isUsingWebWorker, worker: functionWorker.current }
}
