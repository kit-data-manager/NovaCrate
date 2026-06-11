import { InferUITools, ToolUIPart } from "ai"
import type { tools } from "@/lib/ai/tools"
import { ComponentType, PropsWithChildren } from "react"
import { LoaderCircle, TriangleAlert } from "lucide-react"

export function ToolCall({
    part,
    icon,
    children
}: PropsWithChildren<{
    part: ToolUIPart<InferUITools<typeof tools>>
    icon: ComponentType<{ className: string }>
}>) {
    const Icon = icon

    if (part.state === "output-error") {
        return (
            <div className="flex items-center gap-1 text-error/50">
                <TriangleAlert className="size-4" /> Tool {part.type} failed
            </div>
        )
    }

    if (part.state === "output-denied") {
        return (
            <div className="flex items-center gap-1 text-error/50">
                <TriangleAlert className="size-4" /> Tool {part.type} not allowed
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1 text-muted-foreground">
            {part.state === "output-available" ? (
                <Icon className="size-4" />
            ) : (
                <LoaderCircle className="size-4 animate-spin" />
            )}{" "}
            {children}
        </div>
    )
}
