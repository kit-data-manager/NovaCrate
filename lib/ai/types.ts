import type { InferUITools, UIMessage } from "ai"
import type { tools } from "@/lib/ai/tools"

// The UIMessage type of the NovaCrate AI Assistant
export type NC_UIMessage = UIMessage<never, never, InferUITools<typeof tools>>
