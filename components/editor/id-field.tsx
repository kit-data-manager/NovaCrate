import { Copy, EllipsisVertical, ScanBarcode } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useCopyToClipboard } from "usehooks-ts"
import { useCallback } from "react"

export function IDField({ value }: { value: string }) {
    const [_, copy] = useCopyToClipboard()

    const copyFn = useCallback(() => {
        copy(value).then()
    }, [copy, value])

    return (
        <div className="flex grow justify-start pl-3 items-center rounded-lg p-2">
            <ScanBarcode className="w-4 h-4 pointer-events-none text-muted-foreground mr-2 shrink-0" />
            <span className="truncate grow">{value}</span>
            <DropdownMenu>
                <DropdownMenuTrigger className="p-2">
                    <EllipsisVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={copyFn}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
