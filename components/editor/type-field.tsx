import { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Shapes } from "lucide-react"

export function TypeField({
    value,
    onChange
}: {
    value: string
    onChange: (value: ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <Button variant="outline" className="flex w-full justify-start pl-3">
            <Shapes className="w-4 h-4 pointer-events-none text-muted-foreground mr-2" />
            {value}
        </Button>
    )
}
