import {
    getPropertyComment as localGetPropertyComment,
    getPropertyRange as localGetPropertyRange
} from "@/lib/crate-verify/helpers"
import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"

export interface ICrateVerifyContext {
    isReady: boolean
    isUsingWebWorker: boolean
    getPropertyComment: (propertyId: string) => Promise<ReturnType<typeof localGetPropertyComment>>
    getPropertyRange: (propertyId: string) => Promise<ReturnType<typeof localGetPropertyRange>>
}

export const CrateVerifyContext = createContext<ICrateVerifyContext>({
    isReady: false,
    isUsingWebWorker: false,
    async getPropertyComment() {
        return undefined
    },
    async getPropertyRange() {
        return []
    }
})

function post(worker: Worker, msg: Omit<CrateVerifyWorkerCommand, "nonce">) {
    const nonce = Date.now() + "" + Math.random()

    return new Promise((resolve, reject) => {
        autoResolve(resolve, reject, nonce, worker)
        worker.postMessage({ ...msg, nonce })
    })
}

function autoResolve(
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

export function CrateVerifyProvider(props: PropsWithChildren) {
    const [isReady, setIsReady] = useState(false)
    const [isUsingWebWorker, setIsUsingWebWorker] = useState(false)

    const worker = useRef<Worker | null>(null)

    const getPropertyComment = useCallback((propertyId: string) => {
        if (worker.current) {
            return post(worker.current, {
                operation: "getPropertyComment",
                propertyId: propertyId
            }) as Promise<ReturnType<typeof localGetPropertyComment>>
        } else {
            return Promise.resolve(localGetPropertyComment(propertyId))
        }
    }, [])

    const getPropertyRange = useCallback((propertyId: string) => {
        if (worker.current) {
            return post(worker.current, {
                operation: "getPropertyRange",
                propertyId: propertyId
            }) as Promise<ReturnType<typeof localGetPropertyRange>>
        } else {
            return Promise.resolve(localGetPropertyRange(propertyId))
        }
    }, [])

    useEffect(() => {
        if (window.Worker) {
            worker.current = new Worker("/crate-verify-worker.js")
            setIsUsingWebWorker(true)
        }

        setIsReady(true)
    }, [])

    return (
        <CrateVerifyContext.Provider
            value={{
                isReady,
                isUsingWebWorker,
                getPropertyComment,
                getPropertyRange
            }}
        >
            {props.children}
        </CrateVerifyContext.Provider>
    )
}
