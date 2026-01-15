const HEALTH_TEST_FN = "__healthTest__"

interface FunctionWorkerMessage {
    name: string
    args: any[]
    nonce: string
}

/**
 * Utility to let a script work as a function worker. Should be used in a web worker script
 * @param functions Functions that the worker can run (flat object containing functions)
 */
export function workAsFunctionWorker<T extends Record<string, (...args: any[]) => any>>(
    functions: T
) {
    addEventListener("message", async (event) => {
        const { name, args, nonce } = event.data as FunctionWorkerMessage

        if (name in functions) {
            try {
                const data = await functions[name](...args)
                postMessage({ nonce, data })
            } catch (error) {
                postMessage({ nonce, error })
            }
        } else if (name === HEALTH_TEST_FN) {
            postMessage({ nonce, data: true })
        } else
            postMessage({
                nonce,
                error: `FunctionWorkerClient: Function ${name} does not exists in functions object`
            })
    })
}
