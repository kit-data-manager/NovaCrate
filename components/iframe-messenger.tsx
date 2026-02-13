import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { z } from "zod/mini"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import packageJson from "@/package.json"

const incomingMessageSchema = z.xor([
    z.object({
        target: z.literal("novacrate"),
        type: z.literal("LOAD_CRATE"),
        metadata: z.string()
    }),
    z.object({
        target: z.literal("novacrate"),
        type: z.literal("GET_CRATE")
    })
])

const outgoingMessageSchema = z.xor([
    z.object({
        source: z.literal("novacrate"),
        type: z.literal("READY"),
        novaCrateVersion: z.string(),
        messageInterfaceVersion: z.number()
    }),
    z.object({
        source: z.literal("novacrate"),
        type: z.literal("GET_CRATE_RESPONSE"),
        metadata: z.string()
    }),
    z.object({
        source: z.literal("novacrate"),
        type: z.literal("CRATE_CHANGED"),
        metadata: z.string()
    })
])

type NovaCrateMessageIncoming = z.infer<typeof incomingMessageSchema>
type NovaCrateMessageOutgoing = z.infer<typeof outgoingMessageSchema>

export function IFrameMessenger() {
    const crateData = useContext(CrateDataContext)
    const [loadedCrateID, setLoadedCrateID] = useState<string | undefined>()

    const loadCrate = useCallback(
        async (msg: NovaCrateMessageIncoming & { type: "LOAD_CRATE" }) => {
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

    const returnCrate = useCallback(
        async (msg: NovaCrateMessageIncoming & { type: "GET_CRATE" }) => {
            if (loadedCrateID) {
                const crate = await crateData.serviceProvider?.getCrate(loadedCrateID)
                if (crate) {
                    window.parent.postMessage(
                        {
                            type: "GET_CRATE_RESPONSE",
                            source: "novacrate",
                            metadata: JSON.stringify(crate)
                        } satisfies NovaCrateMessageOutgoing,
                        "*" // TODO use appropriate origin
                    )
                }
            }
        },
        [crateData.serviceProvider, loadedCrateID]
    )

    const hasSentReadyMessage = useRef(false)
    useEffect(() => {
        const messageListener = async (e: MessageEvent) => {
            console.log("Received message", e)
            const msg = incomingMessageSchema.safeParse(e.data)
            if (msg.success) {
                switch (msg.data.type) {
                    case "LOAD_CRATE": {
                        loadCrate(msg.data).catch((e) =>
                            console.error("Error in IFrameMessenger: ", e)
                        )
                        break
                    }
                    case "GET_CRATE": {
                        returnCrate(msg.data).catch((e) =>
                            console.error("Error in IFrameMessenger: ", e)
                        )
                        break
                    }
                }
            }
        }

        window.addEventListener("message", messageListener)

        if (!hasSentReadyMessage.current)
            window.parent.postMessage(
                {
                    source: "novacrate",
                    type: "READY",
                    novaCrateVersion: packageJson.version,
                    messageInterfaceVersion: 1
                } satisfies NovaCrateMessageOutgoing,
                "*" // TODO use appropriate origin
            )
        hasSentReadyMessage.current = true

        return () => window.removeEventListener("message", messageListener)
    }, [loadCrate, returnCrate])

    return null
}
