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
        type: z.literal("UPDATE_CRATE"),
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
            let id = await crateData.serviceProvider?.createCrateFromMetadataFile(
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

    const updateCrate = useCallback(
        async (msg: NovaCrateMessageIncoming & { type: "UPDATE_CRATE" }) => {
            if (!loadedCrateID)
                return console.warn("Tried to update crate, but no crate was loaded yet.")

            await crateData.serviceProvider?.saveRoCrateMetadataJSON(loadedCrateID, msg.metadata)
            crateData.reload()
        },
        [loadedCrateID, crateData]
    )

    const returnCrate = useCallback(async () => {
        if (loadedCrateID) {
            const crate = await crateData.serviceProvider?.getCrate(loadedCrateID)
            if (crate) {
                window.parent.postMessage(
                    {
                        type: "GET_CRATE_RESPONSE",
                        source: "novacrate",
                        metadata: JSON.stringify(crate)
                    } satisfies NovaCrateMessageOutgoing,
                    z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGINS)
                )
            }
        }
    }, [crateData.serviceProvider, loadedCrateID])

    const handleIncomingMessage = useCallback(
        (msg: NovaCrateMessageIncoming) => {
            switch (msg.type) {
                case "LOAD_CRATE": {
                    loadCrate(msg).catch((e) => console.error("Error in IFrameMessenger: ", e))
                    break
                }
                case "UPDATE_CRATE": {
                    updateCrate(msg).catch((e) => console.error("Error in IFrameMessenger: ", e))
                    break
                }
                case "GET_CRATE": {
                    returnCrate().catch((e) => console.error("Error in IFrameMessenger: ", e))
                    break
                }
            }
        },
        [loadCrate, returnCrate, updateCrate]
    )

    const hasSentReadyMessage = useRef(false)
    useEffect(() => {
        const messageListener = async (e: MessageEvent) => {
            const msg = incomingMessageSchema.safeParse(e.data)
            if (msg.success) {
                handleIncomingMessage(msg.data)
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
                z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGINS)
            )
        hasSentReadyMessage.current = true

        return () => window.removeEventListener("message", messageListener)
    }, [handleIncomingMessage])

    return null
}
