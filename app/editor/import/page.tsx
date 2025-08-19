"use client"

import { useCallback, useContext, useEffect, useState } from "react"
import * as z from "zod/mini"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { router } from "next/client"
import { Error } from "@/components/error"

const importMessageSchema = z.object({
    type: z.literal("import"),
    data: z.instanceof(Blob)
})

export default function ImportPage() {
    const crateData = useContext(CrateDataContext)
    const [importError, setImportError] = useState<unknown>(undefined)

    const messageListener = useCallback(
        async (msg: MessageEvent<unknown>) => {
            console.log("Received message", msg.data, msg.origin, msg)

            const parsed = importMessageSchema.safeParse(msg.data)
            if (parsed.success) {
                const blob = parsed.data.data
                console.log("Received blob", blob, blob.type)
                if (crateData.serviceProvider) {
                    try {
                        router.prefetch("/editor/full/entities").then()
                        const id = await crateData.serviceProvider.createCrateFromCrateZip(blob)
                        crateData.setCrateId(id)
                        router.push(`/editor/full/entities`).then()
                    } catch (e) {
                        setImportError(e)
                    }
                }
            }
        },
        [crateData]
    )

    useEffect(() => {
        window.addEventListener("message", messageListener)
        return () => window.removeEventListener("message", messageListener)
    }, [messageListener])

    return (
        <div className="flex place-items-center items-center justify-center flex-col min-w-screen min-h-screen gap-4">
            <Error error={importError} title={"Import failed"} />
            <div>Waiting for import...</div>
        </div>
    )
}
