import { useParams } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"
import { z } from "zod/mini"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

const incomingMessageSchema = z.xor([
    z.object({
        type: z.literal("PUSH_CRATE"),
        metadata: z.optional(z.string())
    }),
    z.object({
        type: z.literal("PULL_CRATE")
    })
])

const outgoingMessageSchema = z.xor([
    z.object({
        type: z.literal("READY"),
        novaCrateVersion: z.string(),
        messageInterfaceVersion: z.number()
    }),
    z.object({
        type: z.literal("PULL_CRATE_RESPONSE"),
        metadata: z.optional(z.string())
    })
])

type NovaCrateMessageIncoming = z.infer<typeof incomingMessageSchema>

export function IFrameMessenger() {
    const crateData = useContext(CrateDataContext)
    const [loadedCrateID, setLoadedCrateID] = useState<string | undefined>()

    const loadCrate = useCallback(
        async (msg: NovaCrateMessageIncoming & { type: "PUSH_CRATE" }) => {
            let id: string | undefined
            if (msg.metadata)
                id = await crateData.serviceProvider?.createCrateFromMetadataFile(
                    new Blob([msg.metadata], {
                        type: "application/json"
                    })
                )

            if (id) {
                crateData.setCrateId(id)
                setLoadedCrateID(id)
            }
        },
        [crateData]
    )

    useEffect(() => {
        const messageListener = async (e: MessageEvent) => {
            console.log("Received message", e)
            const msg = incomingMessageSchema.safeParse(e.data)
            if (msg.success) {
                switch (msg.data.type) {
                    case "PUSH_CRATE": {
                        loadCrate(msg.data)
                        break
                    }
                }
            }
        }

        window.addEventListener("message", messageListener)
        return () => window.removeEventListener("message", messageListener)
    }, [crateData, loadCrate])

    return null
}
