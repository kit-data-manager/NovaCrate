import { useCallback, useEffect, useRef, useState } from "react"
import { FunctionWorker } from "@/lib/function-worker"
import { useInterval } from "usehooks-ts"

export function useFunctionWorker<T extends Record<string, (...args: any[]) => any>>(
    functions: T,
    scriptPath: string
) {
    const functionWorker = useRef(new FunctionWorker(functions))
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
