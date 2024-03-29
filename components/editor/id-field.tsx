import { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Fingerprint } from "lucide-react"

export function IDField({
    value,
    onChange
}: {
    value: string
    onChange: (value: ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <Button variant="outline" className="flex grow justify-start pl-3">
            <Fingerprint className="w-4 h-4 pointer-events-none text-muted-foreground mr-2" />
            {value}
        </Button>
    )
}
