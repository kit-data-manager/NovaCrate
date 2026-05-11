"use client"

import { useCallback, useEffect, useRef } from "react"
import { z } from "zod/mini"
import { usePersistence } from "@/components/providers/persistence-provider"
import { IFramePersistenceService } from "@/lib/persistence/iframe/IFramePersistenceService"
import packageJson from "@/package.json"
import {
    incomingMessageSchema,
    NovaCrateMessageIncoming,
    NovaCrateMessageOutgoing
} from "@/lib/iframe-messages"

function getTargetOrigin(): string {
    return z.string().parse(process.env.NEXT_PUBLIC_IFRAME_TARGET_ORIGIN)
}

function postToParent(msg: NovaCrateMessageOutgoing): void {
    window.parent.postMessage(msg, getTargetOrigin())
}

/**
 * Renderless component that bridges the parent page and the
 * {@link IFramePersistenceService} via the `postMessage` API.
 *
 * Must be mounted inside a {@link PersistenceProvider} that was created in
 * iframe mode. Expects `usePersistence()` to return an
 * {@link IFramePersistenceService}.
 */
export function IFrameMessenger() {
    const persistence = usePersistence()

    if (!(persistence instanceof IFramePersistenceService)) {
        throw new Error(
            "IFrameMessenger must be used with an IFramePersistenceService. " +
                "Ensure PersistenceProvider is mounted with mode='iframe'."
        )
    }

    const iframePersistence = persistence

    // ── Handlers for incoming messages ───────────────────────────────────

    const loadCrate = useCallback(
        (msg: NovaCrateMessageIncoming & { type: "LOAD_CRATE" }) => {
            iframePersistence.loadCrate(msg.metadata)
        },
        [iframePersistence]
    )

    const updateCrate = useCallback(
        async (msg: NovaCrateMessageIncoming & { type: "UPDATE_CRATE" }) => {
            await iframePersistence.updateCrate(msg.metadata)
        },
        [iframePersistence]
    )

    const returnCrate = useCallback(async () => {
        const metadata = await iframePersistence.getCurrentMetadata()
        if (metadata) {
            postToParent({
                type: "GET_CRATE_RESPONSE",
                source: "novacrate",
                metadata
            })
        }
    }, [iframePersistence])

    const handleIncomingMessage = useCallback(
        (msg: NovaCrateMessageIncoming) => {
            switch (msg.type) {
                case "LOAD_CRATE": {
                    loadCrate(msg)
                    break
                }
                case "UPDATE_CRATE": {
                    updateCrate(msg).catch((e) =>
                        console.error("Error in IFrameMessenger: ", e)
                    )
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

    // ── postMessage listener + READY signal ──────────────────────────────

    const hasSentReadyMessage = useRef(false)

    useEffect(() => {
        const targetOrigin = getTargetOrigin()

        const messageListener = (e: MessageEvent) => {
            const msg = incomingMessageSchema.safeParse(e.data)
            if (msg.success && e.origin === targetOrigin) {
                handleIncomingMessage(msg.data)
            }
        }

        window.addEventListener("message", messageListener)

        if (!hasSentReadyMessage.current) {
            postToParent({
                source: "novacrate",
                type: "READY",
                novaCrateVersion: packageJson.version,
                messageInterfaceVersion: 1
            })
            hasSentReadyMessage.current = true
        }

        return () => window.removeEventListener("message", messageListener)
    }, [handleIncomingMessage])

    // ── Notify parent on metadata changes (user saves) ───────────────────
    //
    // Subscribes to `crate-service-changed` on the persistence service. Each
    // time a new crate service is created (after LOAD_CRATE), subscribes to
    // its `metadata-changed` event and cleans up the previous subscription.

    useEffect(() => {
        let removeMetadataListener: (() => void) | null = null

        function subscribeToMetadata() {
            // Clean up any previous listener
            removeMetadataListener?.()
            removeMetadataListener = null

            const crateService = iframePersistence.getCrateService()
            if (!crateService) return

            removeMetadataListener = crateService.events.addEventListener(
                "metadata-changed",
                (newMetadata: string) => {
                    postToParent({
                        source: "novacrate",
                        type: "CRATE_CHANGED",
                        metadata: newMetadata
                    })
                }
            )
        }

        // Subscribe to the current crate service (if any)
        subscribeToMetadata()

        // Re-subscribe whenever the crate service changes
        const removeCrateServiceListener = iframePersistence.events.addEventListener(
            "crate-service-changed",
            () => subscribeToMetadata()
        )

        return () => {
            removeCrateServiceListener()
            removeMetadataListener?.()
        }
    }, [iframePersistence])

    return null
}
