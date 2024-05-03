import { ScanBarcode } from "lucide-react"

export function IDField({ value }: { value: string }) {
    return (
        <div className="flex grow justify-start pl-3 items-center rounded-lg p-2">
            <ScanBarcode className="w-4 h-4 pointer-events-none text-muted-foreground mr-2" />
            {value}
        </div>
    )
}
