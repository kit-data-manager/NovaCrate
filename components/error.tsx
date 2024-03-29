import { CircleAlert } from "lucide-react"

export function Error({ text }: { text: string }) {
    if (!text) return null

    return (
        <div className="text-destructive-foreground bg-destructive rounded p-2 flex items-center text-sm">
            <CircleAlert className="w-4 h-4 mr-2" />
            {text}
        </div>
    )
}
