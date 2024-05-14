import { CircleAlert, TriangleAlert } from "lucide-react"
import { ReactNode } from "react"

function cn(size?: "md" | "xl") {
    if (!size || size == "md") {
        return "text-destructive-foreground bg-destructive rounded p-2 flex items-center text-sm"
    } else {
        return "text-destructive-foreground bg-destructive rounded p-4 flex items-center text-xl"
    }
}

function cnIcon(size?: "md" | "xl") {
    if (!size || size == "md") {
        return "w-4 h-4 mr-2 shrink-0"
    } else {
        return "w-8 h-8 mr-4 shrink-0"
    }
}

export function Error({
    text,
    size,
    className,
    prefix
}: {
    text: string | ReactNode
    size?: "md" | "xl"
    className?: string
    prefix?: string
}) {
    if (!text) return null

    return (
        <div className={cn(size) + " " + className}>
            <CircleAlert className={cnIcon(size)} />
            {prefix ? prefix + text : text + ""}
        </div>
    )
}

export function Warn({
    text,
    size,
    className,
    prefix
}: {
    text: string | ReactNode
    size?: "md" | "xl"
    className?: string
    prefix?: string
}) {
    if (!text) return null

    return (
        <div
            className={cn(size) + " " + className + " !bg-transparent border-warn border text-warn"}
        >
            <TriangleAlert className={cnIcon(size)} />
            {prefix ? prefix + text : text + ""}
        </div>
    )
}
