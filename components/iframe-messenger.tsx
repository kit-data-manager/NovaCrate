import { useParams } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"
import { z } from "zod/mini"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

const schema = z.xor([
    z.object({
        type: z.literal("load-ro-crate"),
        metadata: z.optional(z.string()),
        archive: z.optional(z.instanceof(Blob))
    })
])

type NovaCrateMessage = z.infer<typeof schema>

export function IFrameMessenger() {
    const { mode } = useParams<{ mode: string }>()
    const crateData = useContext(CrateDataContext)
    const [loadedCrateID, setLoadedCrateID] = useState<string | undefined>()

    const loadCrate = useCallback(
        async (msg: NovaCrateMessage & { type: "load-ro-crate" }) => {
            let id: string | undefined
            if (msg.archive) id = await crateData.serviceProvider?.createCrateFromFile(msg.archive)
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
        if (mode !== "iframe") return

        const messageListener = async (e: MessageEvent) => {
            const msg = schema.safeParse(e.data)
            if (msg.success) {
                switch (msg.data.type) {
                    case "load-ro-crate": {
                        loadCrate(msg.data)
                        break
                    }
                }
            }
        }

        window.addEventListener("message", messageListener)
        return () => window.removeEventListener("message", messageListener)
    }, [crateData, loadCrate, mode])

    return null
}
