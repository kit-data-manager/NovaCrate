import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { z } from "zod/mini"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import packageJson from "@/package.json"
import { IFrameCrateService } from "@/lib/backend/IFrameCrateService"
import {
    incomingMessageSchema,
    NovaCrateMessageIncoming,
    NovaCrateMessageOutgoing
} from "@/lib/iframe-messages"

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
                    z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGIN)
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
            if (
                msg.success &&
                e.origin === z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGIN)
            ) {
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
                z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGIN)
            )
        hasSentReadyMessage.current = true

        return () => window.removeEventListener("message", messageListener)
    }, [handleIncomingMessage])

    const onSaveCallback = useCallback(async () => {
        if (!loadedCrateID) return
        const crate = await crateData.serviceProvider?.getCrate(loadedCrateID)
        if (!crate) return
        window.parent.postMessage(
            {
                source: "novacrate",
                type: "CRATE_CHANGED",
                metadata: JSON.stringify(crate)
            } satisfies NovaCrateMessageOutgoing,
            z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGIN)
        )
    }, [crateData.serviceProvider, loadedCrateID])

    // Register callback for sending change notification to parent
    useEffect(() => {
        if (crateData.serviceProvider instanceof IFrameCrateService) {
            crateData.serviceProvider.setOnSaveCallback(onSaveCallback)
        }
    }, [crateData.serviceProvider, onSaveCallback])

    return null
}
