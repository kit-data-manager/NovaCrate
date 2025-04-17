import { ChangeEvent } from "react"
import { useTypeIcon } from "@/components/type-icon"

export function TypeField({
    value
}: {
    value: string
    onChange: (value: ChangeEvent<HTMLInputElement>) => void
}) {
    const Icon = useTypeIcon(value)

    return (
        // <Button variant="outline" className="flex w-full justify-start pl-3">
        <div className="flex grow justify-start pl-3 items-center rounded-lg p-2">
            <Icon className="size-4 pointer-events-none text-muted-foreground mr-2" />
            {value}
        </div>
        // </Button>
    )
}
