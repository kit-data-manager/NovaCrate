import { z } from "zod/mini"

export const incomingMessageSchema = z.xor([
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

export const outgoingMessageSchema = z.xor([
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

export type NovaCrateMessageIncoming = z.infer<typeof incomingMessageSchema>
export type NovaCrateMessageOutgoing = z.infer<typeof outgoingMessageSchema>
