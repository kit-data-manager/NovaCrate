/* eslint-disable @typescript-eslint/no-explicit-any */
const HEALTH_TEST_FN = "__healthTest__"

interface FunctionWorkerOptions {
    /**
     * Whether the execution of a function should fall back to executing locally if the web worker
     * is not available
     * @default true
     */
    localFallback?: boolean
}

/**
 * Class to construct a function worker. Should be constructed in the main thread to hold the Web Worker.
 */
export class FunctionWorker<T extends Record<string, (...args: any[]) => any>> {
    private readonly functions: T
    private _worker: Worker | undefined
    private options: FunctionWorkerOptions

    constructor(functions: T, options: FunctionWorkerOptions = { localFallback: true }) {
        this.functions = functions
        this.options = options
    }

    get worker() {
        return this._worker
    }

    get workerMounted() {
        return this._worker !== undefined
    }

    set worker(_: Worker | undefined) {
        throw "worker is read-only"
    }

    mount(scriptPath: string) {
        if (typeof window !== "undefined" && window.Worker) {
            this._worker = new window.Worker(scriptPath)
            return true
        } else return false
    }

    unmount() {
        this._worker = undefined
    }

    execute<K extends keyof T>(name: K, ...args: Parameters<T[K]>): Promise<ReturnType<T[K]>> {
        return this._worker ? this.workerExecute(name, args) : this.localExecute(name, args)
    }

    executeTransfer<K extends keyof T>(
        name: K,
        transfer: Transferable[],
        ...args: Parameters<T[K]>
    ): Promise<ReturnType<T[K]>> {
        return this._worker
            ? this.workerExecute(name, args, transfer)
            : this.localExecute(name, args)
    }

    healthTest(): Promise<boolean> {
        if (!this.worker) return Promise.resolve(false)
        const worker = this.worker
        const nonce = Date.now() + "" + Math.random()
        return new Promise<boolean>((resolve, reject) => {
            this.autoResolve(resolve, reject, nonce, worker)
            worker.postMessage({ name: HEALTH_TEST_FN, args: [], nonce })
        })
    }

    private localExecute<K extends keyof T>(
        name: K,
        args: Parameters<T[K]>
    ): Promise<ReturnType<T[K]>> {
        if (!this.options.localFallback)
            throw "FunctionWorker: Web worker is not available. Local Fallback is disabled."
        console.warn(
            "FunctionWorker: Executing function locally because the worker is not available",
            name
        )
        return Promise.resolve(this.functions[name](...args))
    }

    private workerExecute<K extends keyof T>(
        name: K,
        args: Parameters<T[K]>,
        transfer?: Transferable[]
    ): Promise<ReturnType<T[K]>> {
        if (!this._worker) throw "FunktionWorker: workerExecute: There is no worker!"
        const worker = this._worker
        const nonce = Date.now() + "" + Math.random()

        return new Promise((resolve, reject) => {
            this.autoResolve(resolve, reject, nonce, worker)
            return transfer
                ? worker.postMessage({ name, args, nonce }, transfer)
                : worker.postMessage({ name, args, nonce })
        })
    }

    private autoResolve(
        resolve: (data: any) => void,
        reject: (error: any) => void,
        nonce: string,
        worker: Worker
    ) {
        function handler(event: MessageEvent) {
            if (event.data.nonce === nonce) {
                if (event.data.error) {
                    reject(event.data.error)
                } else {
                    resolve(event.data.data)
                }

                worker.removeEventListener("message", handler)
            }
        }

        worker.addEventListener("message", handler)
    }
}

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
