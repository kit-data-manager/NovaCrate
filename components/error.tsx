import { CircleAlert } from "lucide-react"

function cn(size?: "md" | "xl") {
    if (!size || size == "md") {
        return "text-destructive-foreground bg-destructive rounded p-2 flex items-center text-sm"
    } else {
        return "text-destructive-foreground bg-destructive rounded p-4 flex items-center text-xl"
    }
}

function cnIcon(size?: "md" | "xl") {
    if (!size || size == "md") {
        return "w-4 h-4 mr-2"
    } else {
        return "w-8 h-8 mr-4"
    }
}

export function Error({
    text,
    size,
    className
}: {
    text: string
    size?: "md" | "xl"
    className?: string
}) {
    if (!text) return null

    return (
        <div className={cn(size) + " " + className}>
            <CircleAlert className={cnIcon(size)} />
            {text + ""}
        </div>
    )
}
